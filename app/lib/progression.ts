export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type ProgressionCell = {
  root: string;
  chordTypeId: string;
};

export type ProgressionBeatEventType = "hit" | "rest" | "tie";
export type ProgressionDurationSteps = 1 | 2 | 3 | 4;

export type ProgressionBeat = {
  chordOverride?: ProgressionCell;
};

export type ProgressionRhythmEvent = {
  startStep: number;
  durationSteps: ProgressionDurationSteps;
  eventType: ProgressionBeatEventType;
};

export type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
  beats?: readonly [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
  rhythm?: readonly ProgressionRhythmEvent[];
};

export type ChordProgression = {
  bpm: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

export type ProgressionPosition = {
  elapsedSeconds: number;
  beatIndex: number;
  barIndex: number;
  beatInBar: number;
  stepIndex: number;
  stepInBeat: number;
  stepInBar: number;
};

export type ProgressionSelection = {
  bar: ProgressionBar;
  cell: ProgressionCell;
  cellIndex: number;
};

export type ProgressionPlaybackState = {
  position: ProgressionPosition;
  selection?: ProgressionSelection;
};

export const progressionStepsPerBeat = 4;

export function createDefaultProgression(bpm = 120): ChordProgression {
  return {
    bpm,
    timeSignature: { beatsPerBar: 4, beatUnit: 4 },
    bars: [
      makeProgressionBar(1, { root: "C", chordTypeId: "maj7" }),
      makeProgressionBar(2, { root: "A", chordTypeId: "m7" }),
      makeProgressionBar(3, { root: "D", chordTypeId: "m7" }),
      makeProgressionBar(4, { root: "G", chordTypeId: "7" }),
    ],
  };
}

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

export function updateProgressionCell(
  progression: ChordProgression,
  barIndex: number,
  cellIndex: number,
  nextCell: ProgressionCell,
): ChordProgression {
  const currentCell = progression.bars[barIndex]?.cells[cellIndex];
  if (
    currentCell?.root === nextCell.root &&
    currentCell.chordTypeId === nextCell.chordTypeId
  ) {
    return progression;
  }

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      return {
        ...bar,
        cells: [
          cellIndex === 0 ? nextCell : bar.cells[0],
          cellIndex === 1 ? nextCell : bar.cells[1],
        ] as const,
      };
    }),
  };
}

export function updateProgressionBeatChord(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  nextCell: ProgressionCell | undefined,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }

  const currentOverride = currentBar.beats?.[beatIndex]?.chordOverride;
  const hasSameOverride =
    currentOverride?.root === nextCell?.root &&
    currentOverride?.chordTypeId === nextCell?.chordTypeId;
  if ((currentOverride === undefined && nextCell === undefined) || hasSameOverride) {
    return progression;
  }

  const nextBeats = makeProgressionBeats(currentBar);
  nextBeats[beatIndex] = nextCell
    ? { ...nextBeats[beatIndex], chordOverride: { ...nextCell } }
    : removeBeatChordOverride(nextBeats[beatIndex]);
  const hasBeatData = nextBeats.some(hasProgressionBeatData);

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      if (hasBeatData) {
        return { ...bar, beats: nextBeats };
      }

      const { beats: _beats, ...barWithoutBeats } = bar;
      return barWithoutBeats;
    }),
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

  return setProgressionRhythmEvent(progression, barIndex, {
    startStep: beatIndex * progressionStepsPerBeat,
    durationSteps: getProgressionBeatDuration(currentBar, beatIndex),
    eventType,
  });
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

  return setProgressionRhythmEvent(progression, barIndex, {
    startStep: beatIndex * progressionStepsPerBeat,
    durationSteps,
    eventType: getProgressionBeatEventType(currentBar, beatIndex),
  });
}

export function updateProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
  eventType: ProgressionBeatEventType,
  durationSteps: ProgressionDurationSteps,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (
    !currentBar ||
    !Number.isInteger(startStep) ||
    startStep < 0 ||
    startStep >= 16 ||
    startStep + durationSteps > 16
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

  return setProgressionRhythmEvent(nextProgression, barIndex, {
    startStep,
    durationSteps,
    eventType,
  });
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

export function getProgressionBeat(bar: ProgressionBar, beatIndex: number): ProgressionBeat {
  return bar.beats?.[beatIndex] ?? {};
}

export function getProgressionBeatEventType(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionBeatEventType {
  return (
    getProgressionRhythmEventAtStep(bar, beatIndex * progressionStepsPerBeat)?.eventType ??
    "hit"
  );
}

export function getProgressionBeatDuration(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionDurationSteps {
  return (
    getProgressionRhythmEventAtStep(bar, beatIndex * progressionStepsPerBeat)?.durationSteps ??
    progressionStepsPerBeat
  );
}

export function getProgressionRhythmEventAtStep(
  bar: ProgressionBar,
  startStep: number,
): ProgressionRhythmEvent | undefined {
  const explicitEvent = bar.rhythm?.find((event) => event.startStep === startStep);
  if (explicitEvent) {
    return explicitEvent;
  }

  if (startStep >= 0 && startStep < 16 && startStep % progressionStepsPerBeat === 0) {
    return {
      startStep,
      durationSteps: progressionStepsPerBeat,
      eventType: "hit",
    };
  }

  return undefined;
}

export function getProgressionRhythmEvents(bar: ProgressionBar) {
  const startSteps = new Set([0, 4, 8, 12]);
  bar.rhythm?.forEach((event) => startSteps.add(event.startStep));

  return [...startSteps]
    .sort((first, second) => first - second)
    .flatMap((startStep) => {
      const event = getProgressionRhythmEventAtStep(bar, startStep);
      return event ? [event] : [];
    });
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

export function getProgressionCellForBeat(bar: ProgressionBar, beatIndex: number): ProgressionCell {
  const cellIndex = Math.min(Math.floor(beatIndex / 2), bar.cells.length - 1);
  return getProgressionBeat(bar, beatIndex).chordOverride ?? bar.cells[cellIndex];
}

export function makeProgressionBeats(bar: ProgressionBar): [
  ProgressionBeat,
  ProgressionBeat,
  ProgressionBeat,
  ProgressionBeat,
] {
  return [0, 1, 2, 3].map((beatIndex) => ({
    ...getProgressionBeat(bar, beatIndex),
  })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
}

export function makeProgressionBar(
  bar: number,
  firstCell: ProgressionCell,
  secondCell: ProgressionCell = firstCell,
): ProgressionBar {
  return {
    bar,
    cells: [{ ...firstCell }, { ...secondCell }],
  };
}

function removeBeatChordOverride(beat: ProgressionBeat): ProgressionBeat {
  const { chordOverride: _chordOverride, ...beatWithoutChordOverride } = beat;
  return beatWithoutChordOverride;
}

function hasProgressionBeatData(beat: ProgressionBeat) {
  return beat.chordOverride !== undefined;
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
