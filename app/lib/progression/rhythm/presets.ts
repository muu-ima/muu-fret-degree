import {
  progressionStepsPerBeat,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
} from "../model";
import {
  progressionTicksPerBeat,
  getProgressionTimingGridUnitsPerBeat,
  type ProgressionTimingGrid,
} from "./timing-grid";
import {
  getProgressionRhythmTickEventFromPresetEvent,
  getProgressionSixteenthStepFromTickEvent,
  type ProgressionRhythmTickEvent,
} from "./ticks";

export type ProgressionSubdivision = "quarters" | "eighths" | "sixteenths";
export type ProgressionRhythmPresetId =
  | ProgressionSubdivision
  | "dotted-quarter-eighth"
  | "triplet-eighths";

export type ProgressionRhythmPresetEvent = {
  startUnit: number;
  durationUnits: number;
  eventType: ProgressionBeatEventType;
};

export type ProgressionRhythmPresetDefinition = {
  id: ProgressionRhythmPresetId;
  label: string;
  description: string;
  spanBeats: 1 | 2;
  timingGrid: ProgressionTimingGrid;
  events: readonly ProgressionRhythmPresetEvent[];
};

export const progressionRhythmPresets: readonly ProgressionRhythmPresetDefinition[] = [
  {
    id: "quarters",
    label: "4分 ×1",
    description: "1拍",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [{ startUnit: 0, durationUnits: 4, eventType: "hit" }],
  },
  {
    id: "eighths",
    label: "8分 ×2",
    description: "1拍",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [
      { startUnit: 0, durationUnits: 2, eventType: "hit" },
      { startUnit: 2, durationUnits: 2, eventType: "hit" },
    ],
  },
  {
    id: "sixteenths",
    label: "16分 ×4",
    description: "1拍",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [
      { startUnit: 0, durationUnits: 1, eventType: "hit" },
      { startUnit: 1, durationUnits: 1, eventType: "hit" },
      { startUnit: 2, durationUnits: 1, eventType: "hit" },
      { startUnit: 3, durationUnits: 1, eventType: "hit" },
    ],
  },
  {
    id: "dotted-quarter-eighth",
    label: "付点4分 + 8分",
    description: "2拍",
    spanBeats: 2,
    timingGrid: "sixteenth",
    events: [
      { startUnit: 0, durationUnits: 6, eventType: "hit" },
      { startUnit: 6, durationUnits: 2, eventType: "hit" },
    ],
  },
  {
    id: "triplet-eighths",
    label: "3連8分 ×3",
    description: "1拍",
    spanBeats: 1,
    timingGrid: "triplet",
    events: [
      { startUnit: 0, durationUnits: 1, eventType: "hit" },
      { startUnit: 1, durationUnits: 1, eventType: "hit" },
      { startUnit: 2, durationUnits: 1, eventType: "hit" },
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

const progressionDurationSteps = new Set<ProgressionDurationSteps>([1, 2, 3, 4, 6]);

export function getProgressionRhythmPresetStepEvents(
  preset: ProgressionRhythmPresetDefinition,
) {
  const events = getProgressionRhythmPresetTickEvents(preset).map((event) => {
    const stepEvent = getProgressionSixteenthStepFromTickEvent(event);
    if (
      stepEvent === undefined ||
      !progressionDurationSteps.has(stepEvent.durationSteps as ProgressionDurationSteps)
    ) {
      return undefined;
    }

    return {
      ...stepEvent,
      durationSteps: stepEvent.durationSteps as ProgressionDurationSteps,
    };
  });

  return events.every((event) => event !== undefined)
    ? events
    : undefined;
}

export function getProgressionRhythmPresetTickEvents(
  preset: ProgressionRhythmPresetDefinition,
): readonly ProgressionRhythmTickEvent[] {
  return preset.events.flatMap((event) => {
    const tickEvent = getProgressionRhythmTickEventFromPresetEvent(
      preset.timingGrid,
      event,
    );
    return tickEvent ? [tickEvent] : [];
  });
}

export function getProgressionRhythmPresetSpanTicks(
  preset: ProgressionRhythmPresetDefinition,
) {
  return preset.spanBeats * progressionTicksPerBeat;
}

export function matchesProgressionRhythmPreset(
  events: readonly {
    startStep: number;
    durationSteps: ProgressionDurationSteps;
    eventType: ProgressionBeatEventType;
  }[],
  preset: ProgressionRhythmPresetDefinition,
) {
  const presetEvents = getProgressionRhythmPresetStepEvents(preset);
  return presetEvents !== undefined &&
    events.length === presetEvents.length && presetEvents.every((expected, index) => {
    const actual = events[index];
    return actual?.startStep === expected.startStep &&
      actual.durationSteps === expected.durationSteps &&
      actual.eventType === expected.eventType;
  });
}

export function getProgressionRhythmPresetSpanUnits(
  preset: ProgressionRhythmPresetDefinition,
) {
  return preset.spanBeats * getProgressionTimingGridUnitsPerBeat(preset.timingGrid);
}
