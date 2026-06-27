import type {
  ProgressionBar,
  ProgressionDurationSteps,
} from "../model";

const progressionStepsPerBeat = 4;
const progressionStepsPerBar = progressionStepsPerBeat * 4;
const progressionCrossBarDottedQuarterStartStep = progressionStepsPerBeat * 3;
const progressionCrossBarDottedQuarterDurationSteps =
  progressionStepsPerBeat + progressionStepsPerBeat / 2;

export function canSetProgressionRhythmDuration(
  bar: ProgressionBar,
  startStep: number,
  durationSteps: ProgressionDurationSteps,
  nextBar?: ProgressionBar,
) {
  if (!Number.isInteger(startStep) || startStep < 0 || startStep >= progressionStepsPerBar) {
    return false;
  }

  if (startStep + durationSteps > progressionStepsPerBar) {
    if (
      startStep !== progressionCrossBarDottedQuarterStartStep ||
      durationSteps !== progressionCrossBarDottedQuarterDurationSteps ||
      !nextBar
    ) {
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
