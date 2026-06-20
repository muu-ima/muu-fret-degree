import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionBeat,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionPlaybackState,
  type ProgressionPosition,
  type ProgressionRhythmEvent,
  type ProgressionSelection,
  type ProgressionSubdivision,
  type TimeSignature,
} from "./progression-model";
import { getProgressionCellForBeat } from "./progression-harmony";
import {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionBeatSubdivision,
  getProgressionRhythmEventAtStep,
  getProgressionRhythmEvents,
} from "./progression-rhythm";

export {
  createDefaultProgression,
  makeProgressionBar,
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionBeat,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionPlaybackState,
  type ProgressionPosition,
  type ProgressionRhythmEvent,
  type ProgressionSelection,
  type ProgressionSubdivision,
  type TimeSignature,
} from "./progression-model";

export {
  getProgressionBeat,
  getProgressionCellForBeat,
  makeProgressionBeats,
  updateProgressionBeatChord,
  updateProgressionCell,
} from "./progression-harmony";

export {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionBeatSubdivision,
  getProgressionRhythmEventAtStep,
  getProgressionRhythmEvents,
  getProgressionSustainingEventAtStep,
} from "./progression-rhythm";

function normalizeNonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function secondsPerBeat(bpm: number, beatUnit = 4) {
  const normalizedBpm = normalizeNonNegative(bpm);
  const normalizedBeatUnit = normalizeNonNegative(beatUnit);

  if (normalizedBpm === 0 || normalizedBeatUnit === 0) {
    return 0;
  }

  return (60 / normalizedBpm) * (4 / normalizedBeatUnit);
}

export function secondsPerBar(bpm: number, timeSignature: TimeSignature) {
  return secondsPerBeat(bpm, timeSignature.beatUnit) * normalizeNonNegative(timeSignature.beatsPerBar);
}

export function getProgressionPosition(
  elapsedSeconds: number,
  bpm: number,
  timeSignature: TimeSignature,
): ProgressionPosition {
  const safeElapsedSeconds = Math.max(0, elapsedSeconds);
  const beatLength = secondsPerBeat(bpm, timeSignature.beatUnit);
  const barLength = secondsPerBar(bpm, timeSignature);

  if (beatLength === 0 || barLength === 0) {
    return {
      elapsedSeconds: safeElapsedSeconds,
      beatIndex: 0,
      barIndex: 0,
      beatInBar: 0,
      stepIndex: 0,
      stepInBeat: 0,
      stepInBar: 0,
    };
  }

  const beatIndex = Math.floor(safeElapsedSeconds / beatLength);
  const barIndex = Math.floor(safeElapsedSeconds / barLength);
  const stepLength = beatLength / progressionStepsPerBeat;
  const stepIndex = Math.floor(safeElapsedSeconds / stepLength);
  const beatsPerBar = Math.max(1, Math.floor(timeSignature.beatsPerBar));

  return {
    elapsedSeconds: safeElapsedSeconds,
    beatIndex,
    barIndex,
    beatInBar: beatIndex % beatsPerBar,
    stepIndex,
    stepInBeat: stepIndex % progressionStepsPerBeat,
    stepInBar: stepIndex % (beatsPerBar * progressionStepsPerBeat),
  };
}

export function isProgressionBeatStart(position: ProgressionPosition) {
  return position.stepInBeat === 0;
}

export function getCurrentProgressionBar(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionBar | undefined {
  return getProgressionPlaybackState(progression, elapsedSeconds).selection?.bar;
}

export function getCurrentProgressionSelection(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionSelection | undefined {
  return getProgressionPlaybackState(progression, elapsedSeconds).selection;
}

export function getProgressionPlaybackState(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionPlaybackState {
  const position = getProgressionPosition(elapsedSeconds, progression.bpm, progression.timeSignature);

  if (progression.bars.length === 0) {
    return { position };
  }

  const bar = progression.bars[position.barIndex % progression.bars.length];
  const cellIndex = Math.min(Math.floor(position.beatInBar / 2), bar.cells.length - 1);

  return {
    position,
    selection: {
      bar,
      cell: getProgressionCellForBeat(bar, position.beatInBar),
      cellIndex,
    },
  };
}

export function resizeProgressionBars(bars: readonly ProgressionBar[], nextLength: number) {
  if (nextLength <= 0) {
    return [];
  }
  if (bars.length === 0) {
    return [];
  }

  return Array.from({ length: nextLength }, (_, index) => ({
    bar: index + 1,
    cells: bars[index % bars.length].cells.map((cell) => ({ ...cell })) as [
      ProgressionCell,
      ProgressionCell,
    ],
    ...(bars[index % bars.length].beats
      ? {
          beats: bars[index % bars.length].beats?.map((beat) => ({
            ...beat,
            ...(beat.chordOverride ? { chordOverride: { ...beat.chordOverride } } : {}),
          })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat],
        }
      : {}),
    ...(bars[index % bars.length].rhythm
      ? {
          rhythm: bars[index % bars.length].rhythm?.map((event) => ({ ...event })),
        }
      : {}),
  }));
}

export function updateProgressionBarCount(
  progression: ChordProgression,
  nextBarCount: number,
): ChordProgression {
  if (progression.bars.length === nextBarCount) {
    return progression;
  }

  return {
    ...progression,
    bars: resizeProgressionBars(progression.bars, nextBarCount),
  };
}

export function updateProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  if (
    eventType === "tie" &&
    !canTieProgressionBeat(progression.bars, barIndex, beatIndex)
  ) {
    return progression;
  }

  let nextProgression = setProgressionBeatEventType(
    progression,
    barIndex,
    beatIndex,
    eventType,
  );
  if (eventType !== "rest") {
    return nextProgression;
  }

  const totalBeats = progression.bars.length * 4;
  for (let offset = 1; offset < totalBeats; offset += 1) {
    const nextLocation = getRelativeBeatLocation(
      nextProgression.bars,
      barIndex,
      beatIndex,
      offset,
    );
    if (!nextLocation) {
      break;
    }

    const nextEventType = getProgressionBeatEventType(
      nextProgression.bars[nextLocation.barIndex],
      nextLocation.beatIndex,
    );
    if (nextEventType !== "tie") {
      break;
    }

    nextProgression = setProgressionBeatEventType(
      nextProgression,
      nextLocation.barIndex,
      nextLocation.beatIndex,
      "rest",
    );
  }

  return nextProgression;
}

function setProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }

  const currentEventType = getProgressionBeatEventType(currentBar, beatIndex);
  if (currentEventType === eventType) {
    return progression;
  }

  return updateProgressionRhythmEvent(
    progression,
    barIndex,
    beatIndex * progressionStepsPerBeat,
    eventType,
    getProgressionBeatDuration(currentBar, beatIndex),
  );
}

export function updateProgressionBeatDuration(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  durationSteps: ProgressionDurationSteps,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }

  const currentDuration = getProgressionBeatDuration(currentBar, beatIndex);
  if (currentDuration === durationSteps) {
    return progression;
  }

  return updateProgressionRhythmEvent(
    progression,
    barIndex,
    beatIndex * progressionStepsPerBeat,
    getProgressionBeatEventType(currentBar, beatIndex),
    durationSteps,
  );
}

export function updateProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
  eventType: ProgressionBeatEventType,
  durationSteps: ProgressionDurationSteps,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  const nextBarIndex = progression.bars.length > 0
    ? (barIndex + 1) % progression.bars.length
    : barIndex;
  const nextBar = progression.bars[nextBarIndex];
  if (
    !currentBar ||
    !canSetProgressionRhythmDuration(currentBar, startStep, durationSteps, nextBar)
  ) {
    return progression;
  }

  const currentEvent = getProgressionRhythmEventAtStep(currentBar, startStep);
  if (
    currentEvent?.eventType === eventType &&
    currentEvent.durationSteps === durationSteps
  ) {
    return progression;
  }

  let nextProgression = progression;
  const wasCrossBarDottedQuarter =
    startStep === 12 &&
    currentEvent?.eventType === "hit" &&
    currentEvent.durationSteps === 6;
  const willCrossBarDottedQuarter =
    startStep === 12 && eventType === "hit" && durationSteps === 6;

  if (wasCrossBarDottedQuarter && !willCrossBarDottedQuarter) {
    nextProgression = removeExplicitProgressionRhythmEvent(
      nextProgression,
      nextBarIndex,
      0,
    );
  }

  if (startStep === 0 && eventType !== "tie" && progression.bars.length > 0) {
    const previousBarIndex =
      (barIndex + progression.bars.length - 1) % progression.bars.length;
    const crossingSource = progression.bars[previousBarIndex].rhythm?.find(
      (event) =>
        event.startStep === 12 &&
        event.eventType === "hit" &&
        event.durationSteps === 6,
    );
    if (crossingSource) {
      nextProgression = setProgressionRhythmEvent(nextProgression, previousBarIndex, {
        ...crossingSource,
        durationSteps: 4,
      });
    }
  }

  const previousEvent = getProgressionRhythmEvents(currentBar)
    .filter((event) => event.startStep < startStep && event.eventType === "hit")
    .at(-1);
  if (previousEvent) {
    const distanceToNextEvent = startStep - previousEvent.startStep;
    if (
      distanceToNextEvent < previousEvent.durationSteps &&
      distanceToNextEvent <= progressionStepsPerBeat
    ) {
      nextProgression = setProgressionRhythmEvent(nextProgression, barIndex, {
        ...previousEvent,
        durationSteps: distanceToNextEvent as ProgressionDurationSteps,
      });
    }
  }

  nextProgression = setProgressionRhythmEvent(nextProgression, barIndex, {
    startStep,
    durationSteps,
    eventType,
  });

  return willCrossBarDottedQuarter
    ? setProgressionRhythmEvent(nextProgression, nextBarIndex, {
        startStep: 0,
        durationSteps: 4,
        eventType: "tie",
      })
    : nextProgression;
}

export function canSetProgressionRhythmDuration(
  bar: ProgressionBar,
  startStep: number,
  durationSteps: ProgressionDurationSteps,
  nextBar?: ProgressionBar,
) {
  if (
    !Number.isInteger(startStep) ||
    startStep < 0 ||
    startStep >= 16
  ) {
    return false;
  }

  if (startStep + durationSteps > 16) {
    if (startStep !== 12 || durationSteps !== 6 || !nextBar) {
      return false;
    }

    const nextBarHead = nextBar.rhythm?.find((event) => event.startStep === 0);
    return !nextBarHead || nextBarHead.eventType === "tie";
  }

  const nextExplicitEvent = bar.rhythm
    ?.filter((event) => event.startStep > startStep)
    .sort((first, second) => first.startStep - second.startStep)[0];
  return !nextExplicitEvent || startStep + durationSteps <= nextExplicitEvent.startStep;
}

export function removeProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (
    !currentBar ||
    startStep % progressionStepsPerBeat === 0 ||
    !currentBar.rhythm?.some((event) => event.startStep === startStep)
  ) {
    return progression;
  }

  return removeExplicitProgressionRhythmEvent(progression, barIndex, startStep);
}

function removeExplicitProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
) {
  const currentBar = progression.bars[barIndex];
  if (!currentBar?.rhythm?.some((event) => event.startStep === startStep)) {
    return progression;
  }

  const nextRhythm = currentBar.rhythm.filter((event) => event.startStep !== startStep);
  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      if (nextRhythm.length > 0) {
        return { ...bar, rhythm: nextRhythm };
      }

      const { rhythm: _rhythm, ...barWithoutRhythm } = bar;
      return barWithoutRhythm;
    }),
  };
}

export function applyProgressionBeatSubdivision(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  subdivision: ProgressionSubdivision,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }
  if (getProgressionBeatSubdivision(currentBar, beatIndex) === subdivision) {
    return progression;
  }

  let nextProgression = progression;
  if (beatIndex === 3) {
    const crossingSource = currentBar.rhythm?.find(
      (event) =>
        event.startStep === 12 &&
        event.eventType === "hit" &&
        event.durationSteps === 6,
    );
    if (crossingSource) {
      const nextBarIndex = (barIndex + 1) % progression.bars.length;
      nextProgression = removeExplicitProgressionRhythmEvent(
        nextProgression,
        nextBarIndex,
        0,
      );
    }
  }
  if (beatIndex === 0) {
    const previousBarIndex =
      (barIndex + progression.bars.length - 1) % progression.bars.length;
    const crossingSource = progression.bars[previousBarIndex].rhythm?.find(
      (event) =>
        event.startStep === 12 &&
        event.eventType === "hit" &&
        event.durationSteps === 6,
    );
    if (crossingSource) {
      nextProgression = setProgressionRhythmEvent(nextProgression, previousBarIndex, {
        ...crossingSource,
        durationSteps: 4,
      });
    }
  }

  const beatStartStep = beatIndex * progressionStepsPerBeat;
  const beatEndStep = beatStartStep + progressionStepsPerBeat;
  const stepOffsets = subdivision === "eighths" ? [0, 2] : [0, 1, 2, 3];
  const durationSteps: ProgressionDurationSteps = subdivision === "eighths" ? 2 : 1;
  const updatedBar = nextProgression.bars[barIndex];
  const nextRhythm = [
    ...(updatedBar.rhythm?.filter(
      (event) => event.startStep < beatStartStep || event.startStep >= beatEndStep,
    ) ?? []),
    ...stepOffsets.map((stepOffset) => ({
      startStep: beatStartStep + stepOffset,
      durationSteps,
      eventType: "hit" as const,
    })),
  ].sort((first, second) => first.startStep - second.startStep);

  return {
    ...nextProgression,
    bars: nextProgression.bars.map((bar, index) =>
      index === barIndex ? { ...bar, rhythm: nextRhythm } : bar,
    ),
  };
}

export function canTieProgressionBeat(
  bars: readonly ProgressionBar[],
  barIndex: number,
  beatIndex: number,
) {
  if (!bars[barIndex] || beatIndex < 0 || beatIndex > 3) {
    return false;
  }

  const totalBeats = bars.length * 4;
  for (let offset = 1; offset < totalBeats; offset += 1) {
    const previousLocation = getRelativeBeatLocation(
      bars,
      barIndex,
      beatIndex,
      -offset,
    );
    if (!previousLocation) {
      return false;
    }

    const previousEventType = getProgressionBeatEventType(
      bars[previousLocation.barIndex],
      previousLocation.beatIndex,
    );
    if (previousEventType === "hit") {
      return true;
    }
    if (previousEventType === "rest") {
      return false;
    }
  }

  return false;
}

export function countFollowingProgressionTies(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
) {
  if (progression.bars.length === 0 || beatIndex < 0 || beatIndex > 3) {
    return 0;
  }

  const beatsPerBar = Math.min(
    4,
    Math.max(1, Math.floor(progression.timeSignature.beatsPerBar)),
  );
  const totalBeats = progression.bars.length * beatsPerBar;
  const startBeat = barIndex * beatsPerBar + beatIndex;
  let tieCount = 0;

  for (let offset = 1; offset < totalBeats; offset += 1) {
    const absoluteBeat = startBeat + offset;
    const nextBarIndex = Math.floor(absoluteBeat / beatsPerBar) % progression.bars.length;
    const nextBeatIndex = absoluteBeat % beatsPerBar;

    if (getProgressionBeatEventType(progression.bars[nextBarIndex], nextBeatIndex) !== "tie") {
      break;
    }

    tieCount += 1;
  }

  return tieCount;
}

function setProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  nextEvent: ProgressionRhythmEvent,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar) {
    return progression;
  }

  const isDefaultBeatEvent =
    nextEvent.startStep % progressionStepsPerBeat === 0 &&
    nextEvent.eventType === "hit" &&
    nextEvent.durationSteps === progressionStepsPerBeat;
  const nextRhythm = [
    ...(currentBar.rhythm?.filter((event) => event.startStep !== nextEvent.startStep) ?? []),
    ...(isDefaultBeatEvent ? [] : [nextEvent]),
  ].sort((first, second) => first.startStep - second.startStep);

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      if (nextRhythm.length > 0) {
        return { ...bar, rhythm: nextRhythm };
      }

      const { rhythm: _rhythm, ...barWithoutRhythm } = bar;
      return barWithoutRhythm;
    }),
  };
}

function getRelativeBeatLocation(
  bars: readonly ProgressionBar[],
  barIndex: number,
  beatIndex: number,
  offset: number,
) {
  if (bars.length === 0) {
    return undefined;
  }

  const totalBeats = bars.length * 4;
  const startBeat = barIndex * 4 + beatIndex;
  const relativeBeat = ((startBeat + offset) % totalBeats + totalBeats) % totalBeats;

  return {
    barIndex: Math.floor(relativeBeat / 4),
    beatIndex: relativeBeat % 4,
  };
}
