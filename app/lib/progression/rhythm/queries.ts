import {
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionRhythmEvent,
} from "../model";
import {
  getProgressionRhythmPresetSpanSteps,
  getProgressionRhythmPresetStartBeat,
  matchesProgressionRhythmPreset,
  progressionRhythmPresets,
  type ProgressionRhythmPresetId,
  type ProgressionSubdivision,
} from "./presets";

const progressionStepsPerBar = progressionStepsPerBeat * 4;

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

  if (
    startStep >= 0 &&
    startStep < progressionStepsPerBar &&
    startStep % progressionStepsPerBeat === 0
  ) {
    return {
      startStep,
      durationSteps: progressionStepsPerBeat,
      eventType: "hit",
    };
  }

  return undefined;
}

export function getProgressionRhythmEvents(bar: ProgressionBar) {
  const startSteps = new Set(
    Array.from({ length: progressionStepsPerBar / progressionStepsPerBeat }, (_, index) =>
      index * progressionStepsPerBeat,
    ),
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
    return matchesProgressionRhythmPreset(relativeEvents, preset);
  })?.id;
}
