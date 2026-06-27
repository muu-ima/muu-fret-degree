import {
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionRhythmEvent,
} from "../model";
import {
  getProgressionRhythmPresetSpanSteps,
  getProgressionRhythmPresetSpanTicks,
  getProgressionRhythmPresetStartBeat,
  getProgressionRhythmPresetTickEvents,
  matchesProgressionRhythmPreset,
  progressionRhythmPresets,
  type ProgressionRhythmPresetDefinition,
  type ProgressionRhythmPresetId,
  type ProgressionSubdivision,
} from "./presets";
import { progressionTicksPerBeat } from "./timing-grid";
import {
  getProgressionRhythmTickEventFromRhythmEvent,
  type ProgressionRhythmTickEvent,
} from "./ticks";

const progressionStepsPerBar = progressionStepsPerBeat * 4;
const progressionBeatCountPerBar = progressionStepsPerBar / progressionStepsPerBeat;

type ProgressionBarWithTickRhythm = ProgressionBar & {
  tickRhythm?: readonly ProgressionRhythmTickEvent[];
};

function isProgressionBeatAlignedStep(step: number) {
  return step >= 0 && step < progressionStepsPerBar && step % progressionStepsPerBeat === 0;
}

function getProgressionDefaultBeatRhythmEvent(startStep: number): ProgressionRhythmEvent {
  return {
    startStep,
    durationSteps: progressionStepsPerBeat,
    eventType: "hit",
  };
}

function getProgressionBarTickRhythmEvents(bar: ProgressionBar): readonly ProgressionRhythmTickEvent[] {
  return (bar as ProgressionBarWithTickRhythm).tickRhythm ?? [];
}

export function getProgressionTickRhythmEvents(bar: ProgressionBar) {
  const tickRhythm = getProgressionBarTickRhythmEvents(bar);
  if (tickRhythm.length > 0) {
    return tickRhythm;
  }

  return getProgressionRhythmEvents(bar).map(getProgressionRhythmTickEventFromRhythmEvent);
}

export function hasProgressionNonStepTickRhythm(bar: ProgressionBar) {
  return getProgressionBarTickRhythmEvents(bar).some(
    (event) =>
      event.startTick % (progressionTicksPerBeat / 4) !== 0 ||
      event.durationTicks % (progressionTicksPerBeat / 4) !== 0,
  );
}

export function getProgressionTickRhythmEventAtTick(
  bar: ProgressionBar,
  startTick: number,
) {
  return getProgressionTickRhythmEvents(bar).find((event) => event.startTick === startTick);
}

function matchesProgressionRhythmPresetTick(
  events: readonly ProgressionRhythmTickEvent[],
  preset: ProgressionRhythmPresetDefinition,
) {
  const presetEvents = getProgressionRhythmPresetTickEvents(preset);
  return presetEvents.length === events.length && presetEvents.every((expected, index) => {
    const actual = events[index];
    return actual?.startTick === expected.startTick &&
      actual.durationTicks === expected.durationTicks &&
      actual.eventType === expected.eventType;
  });
}

export function getProgressionBeatEventType(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionBeatEventType {
  const startStep = beatIndex * progressionStepsPerBeat;
  return getProgressionRhythmEventAtStep(bar, startStep)?.eventType ??
    (getProgressionSustainingEventAtStep(bar, startStep) ? "tie" : "hit");
}

export function getProgressionBeatDuration(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionDurationSteps {
  return (
    getProgressionRhythmEventAtStep(bar, beatIndex * progressionStepsPerBeat)?.durationSteps ??
    progressionStepsPerBeat
  );
}

export function getProgressionRhythmEventAtStep(
  bar: ProgressionBar,
  startStep: number,
): ProgressionRhythmEvent | undefined {
  const explicitEvent = bar.rhythm?.find((event) => event.startStep === startStep);
  if (explicitEvent) {
    return explicitEvent;
  }

  const isCoveredByExplicitHit = bar.rhythm?.some(
    (event) =>
      event.eventType === "hit" &&
      event.startStep < startStep &&
      event.startStep + event.durationSteps > startStep,
  );
  if (isCoveredByExplicitHit) {
    return undefined;
  }

  if (isProgressionBeatAlignedStep(startStep)) {
    return getProgressionDefaultBeatRhythmEvent(startStep);
  }

  return undefined;
}

export function getProgressionRhythmEvents(bar: ProgressionBar) {
  const startSteps = new Set(
    Array.from({ length: progressionBeatCountPerBar }, (_, index) => index * progressionStepsPerBeat),
  );
  bar.rhythm?.forEach((event) => startSteps.add(event.startStep));

  return [...startSteps]
    .sort((first, second) => first - second)
    .flatMap((startStep) => {
      const event = getProgressionRhythmEventAtStep(bar, startStep);
      return event ? [event] : [];
    });
}

export function getProgressionSustainingEventAtStep(
  bar: ProgressionBar,
  step: number,
): ProgressionRhythmEvent | undefined {
  return getProgressionRhythmEvents(bar)
    .filter(
      (event) =>
        event.eventType === "hit" &&
        event.startStep < step &&
        event.startStep + event.durationSteps > step,
    )
    .at(-1);
}

export function getProgressionBeatSubdivision(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionSubdivision | undefined {
  const preset = getProgressionRhythmPreset(bar, beatIndex);
  return preset === "quarters" || preset === "eighths" || preset === "sixteenths"
    ? preset
    : undefined;
}

export function getProgressionRhythmPreset(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionRhythmPresetId | undefined {
  const events = getProgressionRhythmEvents(bar);
  const tickEvents = getProgressionBarTickRhythmEvents(bar);
  const presetsByLargestSpan = [...progressionRhythmPresets].sort(
    (first, second) => second.spanBeats - first.spanBeats,
  );

  return presetsByLargestSpan.find((preset) => {
    const startBeat = getProgressionRhythmPresetStartBeat(preset, beatIndex);
    const startStep = startBeat * progressionStepsPerBeat;
    const endStep = startStep + getProgressionRhythmPresetSpanSteps(preset);
    const relativeEvents = events
      .filter((event) => event.startStep >= startStep && event.startStep < endStep)
      .map((event) => ({ ...event, startStep: event.startStep - startStep }));
    if (tickEvents.length > 0) {
      const startTick = startBeat * progressionTicksPerBeat;
      const endTick = startTick + getProgressionRhythmPresetSpanTicks(preset);
      const relativeTickEvents = tickEvents
        .filter((event) => event.startTick >= startTick && event.startTick < endTick)
        .map((event) => ({ ...event, startTick: event.startTick - startTick }));
      return matchesProgressionRhythmPresetTick(relativeTickEvents, preset);
    }

    return matchesProgressionRhythmPreset(relativeEvents, preset);
  })?.id;
}
