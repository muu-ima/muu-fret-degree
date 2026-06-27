import type {
  ChordProgression,
  ProgressionRhythmEvent,
} from "../model";
import {
  removeExplicitProgressionRhythmEvent,
  setProgressionRhythmEvent,
} from "./store";

const progressionCrossBarDottedQuarterStartStep = 12;
const progressionCrossBarDottedQuarterDurationSteps = 6;
const progressionBeatStartStep = 0;
const progressionBeatDurationSteps = 4;

export function isCrossBarDottedQuarter(
  event: ProgressionRhythmEvent | undefined,
) {
  return (
    event?.startStep === progressionCrossBarDottedQuarterStartStep &&
    event.eventType === "hit" &&
    event.durationSteps === progressionCrossBarDottedQuarterDurationSteps
  );
}

export function addProgressionCrossBarTie(
  progression: ChordProgression,
  sourceBarIndex: number,
) {
  if (progression.bars.length === 0) {
    return progression;
  }

  const nextBarIndex = (sourceBarIndex + 1) % progression.bars.length;
  return setProgressionRhythmEvent(progression, nextBarIndex, {
    startStep: progressionBeatStartStep,
    durationSteps: progressionBeatDurationSteps,
    eventType: "tie",
  });
}

export function removeProgressionCrossBarTie(
  progression: ChordProgression,
  sourceBarIndex: number,
) {
  if (progression.bars.length === 0) {
    return progression;
  }

  const nextBarIndex = (sourceBarIndex + 1) % progression.bars.length;
  return removeExplicitProgressionRhythmEvent(progression, nextBarIndex, 0);
}

export function shortenProgressionCrossBarSource(
  progression: ChordProgression,
  targetBarIndex: number,
) {
  if (progression.bars.length === 0) {
    return progression;
  }

  const previousBarIndex =
    (targetBarIndex + progression.bars.length - 1) % progression.bars.length;
  const crossingSource = progression.bars[previousBarIndex].rhythm?.find(
    isCrossBarDottedQuarter,
  );
  return crossingSource
    ? setProgressionRhythmEvent(progression, previousBarIndex, {
        ...crossingSource,
        durationSteps: progressionBeatDurationSteps,
      })
    : progression;
}
