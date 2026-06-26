import {
  progressionStepsPerBeat,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
} from "../model";
import {
  getProgressionSixteenthStepFromTicks,
  getProgressionTimingGridUnitsPerBeat,
  getProgressionTimingTicks,
  type ProgressionTimingGrid,
} from "./timing-grid";
import {
  getProgressionRhythmTickEventFromPresetEvent,
  type ProgressionRhythmTickEvent,
} from "./ticks";

export type ProgressionSubdivision = "quarters" | "eighths" | "sixteenths";
export type ProgressionRhythmPresetId =
  | ProgressionSubdivision
  | "dotted-quarter-eighth";

export type ProgressionRhythmPresetEvent = {
  startUnit: number;
  durationUnits: number;
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
    events: [{ startUnit: 0, durationUnits: 4, eventType: "hit" }],
  },
  {
    id: "eighths",
    label: "8ths ×2",
    spanBeats: 1,
    timingGrid: "sixteenth",
    events: [
      { startUnit: 0, durationUnits: 2, eventType: "hit" },
      { startUnit: 2, durationUnits: 2, eventType: "hit" },
    ],
  },
  {
    id: "sixteenths",
    label: "16ths ×4",
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
    label: "Dotted 1/4 + 1/8",
    spanBeats: 2,
    timingGrid: "sixteenth",
    events: [
      { startUnit: 0, durationUnits: 6, eventType: "hit" },
      { startUnit: 6, durationUnits: 2, eventType: "hit" },
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
    const startStep = getProgressionSixteenthStepFromTicks(event.startTick);
    const durationStep = getProgressionSixteenthStepFromTicks(event.durationTicks);

    if (
      startStep === undefined ||
      durationStep === undefined ||
      !progressionDurationSteps.has(durationStep as ProgressionDurationSteps)
    ) {
      return undefined;
    }

    return {
      startStep,
      durationSteps: durationStep as ProgressionDurationSteps,
      eventType: event.eventType,
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
