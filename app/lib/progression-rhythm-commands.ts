import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionRhythmEvent,
  type ProgressionSubdivision,
} from "./progression-model";
import {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionBeatSubdivision,
  getProgressionRhythmEventAtStep,
  getProgressionRhythmEvents,
} from "./progression-rhythm";
import { canSetProgressionRhythmDuration } from "./progression-rhythm-collision";
import { canTieProgressionBeat, getRelativeBeatLocation } from "./progression-ties";

export function updateProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  if (eventType === "tie" && !canTieProgressionBeat(progression.bars, barIndex, beatIndex)) {
    return progression;
  }

  let nextProgression = setProgressionBeatEventType(progression, barIndex, beatIndex, eventType);
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

  if (getProgressionBeatEventType(currentBar, beatIndex) === eventType) {
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
  if (getProgressionBeatDuration(currentBar, beatIndex) === durationSteps) {
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
  if (currentEvent?.eventType === eventType && currentEvent.durationSteps === durationSteps) {
    return progression;
  }

  let nextProgression = progression;
  const wasCrossBarDottedQuarter =
    startStep === 12 && currentEvent?.eventType === "hit" && currentEvent.durationSteps === 6;
  const willCrossBarDottedQuarter =
    startStep === 12 && eventType === "hit" && durationSteps === 6;

  if (wasCrossBarDottedQuarter && !willCrossBarDottedQuarter) {
    nextProgression = removeExplicitProgressionRhythmEvent(nextProgression, nextBarIndex, 0);
  }

  if (startStep === 0 && eventType !== "tie" && progression.bars.length > 0) {
    const previousBarIndex =
      (barIndex + progression.bars.length - 1) % progression.bars.length;
    const crossingSource = progression.bars[previousBarIndex].rhythm?.find(
      (event) =>
        event.startStep === 12 && event.eventType === "hit" && event.durationSteps === 6,
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
        event.startStep === 12 && event.eventType === "hit" && event.durationSteps === 6,
    );
    if (crossingSource) {
      const nextBarIndex = (barIndex + 1) % progression.bars.length;
      nextProgression = removeExplicitProgressionRhythmEvent(nextProgression, nextBarIndex, 0);
    }
  }
  if (beatIndex === 0) {
    const previousBarIndex =
      (barIndex + progression.bars.length - 1) % progression.bars.length;
    const crossingSource = progression.bars[previousBarIndex].rhythm?.find(
      (event) =>
        event.startStep === 12 && event.eventType === "hit" && event.durationSteps === 6,
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
