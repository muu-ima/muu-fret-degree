import {
  progressionStepsPerBeat,
  type ProgressionBeatEventType,
  type ProgressionRhythmEvent,
  type ProgressionPosition,
  type TimeSignature,
} from "../model";
import {
  progressionTicksPerBeat,
  getProgressionSixteenthStepFromTicks,
  getProgressionTimingTicks,
  type ProgressionTimingGrid,
} from "./timing-grid";

export const progressionTicksPerStep = progressionTicksPerBeat / progressionStepsPerBeat;

export type ProgressionRhythmTickEvent = {
  startTick: number;
  durationTicks: number;
  eventType: ProgressionBeatEventType;
};

export type ProgressionTickPosition = {
  tickIndex: number;
  tickInBeat: number;
  tickInBar: number;
};

export function getProgressionRhythmTickEventFromRhythmEvent(
  event: ProgressionRhythmEvent,
): ProgressionRhythmTickEvent {
  return {
    startTick: event.startStep * progressionTicksPerStep,
    durationTicks: event.durationSteps * progressionTicksPerStep,
    eventType: event.eventType,
  };
}

export function getProgressionTickPosition(
  position: ProgressionPosition,
): ProgressionTickPosition {
  return {
    tickIndex: position.stepIndex * progressionTicksPerStep,
    tickInBeat: position.stepInBeat * progressionTicksPerStep,
    tickInBar: position.stepInBar * progressionTicksPerStep,
  };
}

export function getProgressionPositionFromTickIndex(
  tickIndex: number,
  timeSignature: TimeSignature,
): ProgressionPosition | undefined {
  if (
    !Number.isInteger(tickIndex) ||
    tickIndex < 0 ||
    tickIndex % progressionTicksPerStep !== 0
  ) {
    return undefined;
  }

  const stepIndex = tickIndex / progressionTicksPerStep;
  const beatsPerBar = Math.max(1, Math.floor(timeSignature.beatsPerBar));
  const beatIndex = Math.floor(stepIndex / progressionStepsPerBeat);

  return {
    elapsedSeconds: 0,
    beatIndex,
    barIndex: Math.floor(beatIndex / beatsPerBar),
    beatInBar: beatIndex % beatsPerBar,
    stepIndex,
    stepInBeat: stepIndex % progressionStepsPerBeat,
    stepInBar: stepIndex % (beatsPerBar * progressionStepsPerBeat),
  };
}

export function getProgressionRhythmTickEventFromPresetEvent(
  timingGrid: ProgressionTimingGrid,
  event: {
    startUnit: number;
    durationUnits: number;
    eventType: ProgressionBeatEventType;
  },
): ProgressionRhythmTickEvent | undefined {
  const startTick = getProgressionTimingTicks(timingGrid, event.startUnit);
  const durationTicks = getProgressionTimingTicks(timingGrid, event.durationUnits);

  if (
    startTick === undefined ||
    durationTicks === undefined ||
    !Number.isInteger(startTick) ||
    !Number.isInteger(durationTicks)
  ) {
    return undefined;
  }

  return {
    startTick,
    durationTicks,
    eventType: event.eventType,
  };
}

export function getProgressionSixteenthStepFromTickEvent(
  event: ProgressionRhythmTickEvent,
): {
  startStep: number;
  durationSteps: number;
  eventType: ProgressionBeatEventType;
} | undefined {
  const startStep = getProgressionSixteenthStepFromTicks(event.startTick);
  const durationSteps = getProgressionSixteenthStepFromTicks(event.durationTicks);
  return startStep === undefined || durationSteps === undefined
    ? undefined
    : {
        startStep,
        durationSteps,
        eventType: event.eventType,
      };
}
