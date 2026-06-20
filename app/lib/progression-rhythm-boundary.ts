import type {
  ChordProgression,
  ProgressionRhythmEvent,
} from "./progression/model";
import {
  removeExplicitProgressionRhythmEvent,
  setProgressionRhythmEvent,
} from "./progression-rhythm-store";

export function isCrossBarDottedQuarter(
  event: ProgressionRhythmEvent | undefined,
) {
  return event?.startStep === 12 && event.eventType === "hit" && event.durationSteps === 6;
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
    startStep: 0,
    durationSteps: 4,
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
        durationSteps: 4,
      })
    : progression;
}
