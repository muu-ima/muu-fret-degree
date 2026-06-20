import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionRhythmEvent,
} from "./progression-model";

export function removeExplicitProgressionRhythmEvent(
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

export function setProgressionRhythmEvent(
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
