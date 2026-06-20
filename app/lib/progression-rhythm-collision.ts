import type {
  ProgressionBar,
  ProgressionDurationSteps,
} from "./progression-model";

export function canSetProgressionRhythmDuration(
  bar: ProgressionBar,
  startStep: number,
  durationSteps: ProgressionDurationSteps,
  nextBar?: ProgressionBar,
) {
  if (!Number.isInteger(startStep) || startStep < 0 || startStep >= 16) {
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
