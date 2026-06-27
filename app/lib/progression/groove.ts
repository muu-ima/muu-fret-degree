import { progressionStepsPerBeat, type ProgressionDurationSteps } from "./model";
import { secondsPerBeat } from "./state/timeline";

export type ProgressionGroove = "straight" | "shuffle";

const straightStepOffsets = [0, 1 / 4, 1 / 2, 3 / 4] as const;
const shuffleStepOffsets = [0, 1 / 3, 2 / 3, 5 / 6] as const;

function normalizeStepInBeat(step: number) {
  return ((step % progressionStepsPerBeat) + progressionStepsPerBeat) % progressionStepsPerBeat;
}

export function getProgressionGrooveBeatTime(
  absoluteStep: number,
  groove: ProgressionGroove,
) {
  const beatIndex = Math.floor(absoluteStep / progressionStepsPerBeat);
  const stepInBeat = normalizeStepInBeat(absoluteStep);
  const offsets = groove === "shuffle" ? shuffleStepOffsets : straightStepOffsets;
  return beatIndex + offsets[stepInBeat];
}

export function getProgressionGrooveDelaySeconds(
  stepInBeat: number,
  bpm: number,
  groove: ProgressionGroove,
) {
  const normalizedStep = normalizeStepInBeat(stepInBeat);
  const straightTime = straightStepOffsets[normalizedStep];
  const grooveTime = getProgressionGrooveBeatTime(normalizedStep, groove);
  return (grooveTime - straightTime) * secondsPerBeat(bpm);
}

export function getProgressionGrooveDurationSeconds(
  startStepInBeat: number,
  durationSteps: ProgressionDurationSteps,
  bpm: number,
  groove: ProgressionGroove,
) {
  const startTime = getProgressionGrooveBeatTime(startStepInBeat, groove);
  const endTime = getProgressionGrooveBeatTime(startStepInBeat + durationSteps, groove);
  return (endTime - startTime) * secondsPerBeat(bpm);
}
