import type {
  ProgressionDurationSteps,
  ProgressionPlacementValidation,
} from "../../../lib/progression";

export const progressionDurationOptions: readonly {
  steps: ProgressionDurationSteps;
  label: string;
}[] = [
  { steps: 1, label: "1/16" },
  { steps: 2, label: "1/8" },
  { steps: 3, label: "1/8 ·" },
  { steps: 4, label: "1/4" },
  { steps: 6, label: "1/4 ·" },
];

export const progressionStepOptions = [
  { label: "1", stepInBeat: 0 },
  { label: "e", stepInBeat: 1 },
  { label: "&", stepInBeat: 2 },
  { label: "a", stepInBeat: 3 },
] as const;

export function getPlacementValidationMessage(validation: ProgressionPlacementValidation) {
  if (validation.canPlace) {
    return undefined;
  }
  if (validation.reason === "occupied-by-prior-event") {
    return "この位置は先行イベントの音価内です";
  }
  if (validation.reason === "overlaps-following-event") {
    return "この音価は後続イベントと重なります";
  }
  return "この位置にはイベントを配置できません";
}
