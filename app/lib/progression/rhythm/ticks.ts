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

export function getProgressionTickIndex(
  elapsedSeconds: number,
  bpm: number,
  beatUnit: number,
) {
  const safeElapsedSeconds = Math.max(0, elapsedSeconds);
  const safeBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 0;
  const safeBeatUnit = Number.isFinite(beatUnit) && beatUnit > 0 ? beatUnit : 0;
  if (safeBpm === 0 || safeBeatUnit === 0) {
    return 0;
  }

  const secondsPerBeat = (60 / safeBpm) * (4 / safeBeatUnit);
  const secondsPerTick = secondsPerBeat / progressionTicksPerBeat;
  return Math.floor(safeElapsedSeconds / secondsPerTick);
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
