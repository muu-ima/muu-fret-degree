import {
  progressionStepsPerBeat,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
} from "../model";

export type ProgressionTimingGrid = "sixteenth";
export type ProgressionSubdivision = "quarters" | "eighths" | "sixteenths";
export type ProgressionRhythmPresetId =
  | ProgressionSubdivision
  | "dotted-quarter-eighth";

export type ProgressionRhythmPresetEvent = {
  startStep: number;
  durationSteps: ProgressionDurationSteps;
  eventType: ProgressionBeatEventType;
};

export type ProgressionRhythmPresetDefinition = {
  id: ProgressionRhythmPresetId;
  label: string;
  spanBeats: 1 | 2;
  timingGrid: ProgressionTimingGrid;
  events: readonly ProgressionRhythmPresetEvent[];
};

export const progressionRhythmPresets: readonly ProgressionRhythmPresetDefinition[] = [
  {
    id: "quarters",
    label: "Quarter ×1",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [{ startStep: 0, durationSteps: 4, eventType: "hit" }],
  },
  {
    id: "eighths",
    label: "8ths ×2",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [
      { startStep: 0, durationSteps: 2, eventType: "hit" },
      { startStep: 2, durationSteps: 2, eventType: "hit" },
    ],
  },
  {
    id: "sixteenths",
    label: "16ths ×4",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [
      { startStep: 0, durationSteps: 1, eventType: "hit" },
      { startStep: 1, durationSteps: 1, eventType: "hit" },
      { startStep: 2, durationSteps: 1, eventType: "hit" },
      { startStep: 3, durationSteps: 1, eventType: "hit" },
    ],
  },
  {
    id: "dotted-quarter-eighth",
    label: "Dotted 1/4 + 1/8",
    spanBeats: 2,
    timingGrid: "sixteenth",
    events: [
      { startStep: 0, durationSteps: 6, eventType: "hit" },
      { startStep: 6, durationSteps: 2, eventType: "hit" },
    ],
  },
];

export function getProgressionRhythmPresetDefinition(id: ProgressionRhythmPresetId) {
  return progressionRhythmPresets.find((preset) => preset.id === id);
}

export function getProgressionRhythmPresetStartBeat(
  preset: ProgressionRhythmPresetDefinition,
  selectedBeatIndex: number,
) {
  return Math.floor(selectedBeatIndex / preset.spanBeats) * preset.spanBeats;
}

export function getProgressionRhythmPresetSpanSteps(
  preset: ProgressionRhythmPresetDefinition,
) {
  return preset.spanBeats * progressionStepsPerBeat;
}

export function matchesProgressionRhythmPreset(
  events: readonly ProgressionRhythmPresetEvent[],
  preset: ProgressionRhythmPresetDefinition,
) {
  return events.length === preset.events.length && preset.events.every((expected, index) => {
    const actual = events[index];
    return actual?.startStep === expected.startStep &&
      actual.durationSteps === expected.durationSteps &&
      actual.eventType === expected.eventType;
  });
}
