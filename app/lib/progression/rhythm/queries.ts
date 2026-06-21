import {
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionRhythmEvent,
  type ProgressionSubdivision,
} from "../model";

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

  if (startStep >= 0 && startStep < 16 && startStep % progressionStepsPerBeat === 0) {
    return {
      startStep,
      durationSteps: progressionStepsPerBeat,
      eventType: "hit",
    };
  }

  return undefined;
}

export function getProgressionRhythmEvents(bar: ProgressionBar) {
  const startSteps = new Set([0, 4, 8, 12]);
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
  const beatStartStep = beatIndex * progressionStepsPerBeat;
  const beatEndStep = beatStartStep + progressionStepsPerBeat;
  const events = getProgressionRhythmEvents(bar).filter(
    (event) => event.startStep >= beatStartStep && event.startStep < beatEndStep,
  );
  const relativeEvents = events.map((event) => ({
    ...event,
    startStep: event.startStep - beatStartStep,
  }));

  if (
    relativeEvents.length === 1 &&
    relativeEvents[0].startStep === 0 &&
    relativeEvents[0].durationSteps === 4 &&
    relativeEvents[0].eventType === "hit"
  ) {
    return "quarters";
  }

  if (
    relativeEvents.length === 2 &&
    relativeEvents.every(
      (event, index) =>
        event.startStep === index * 2 &&
        event.durationSteps === 2 &&
        event.eventType === "hit",
    )
  ) {
    return "eighths";
  }

  if (
    relativeEvents.length === 4 &&
    relativeEvents.every(
      (event, index) =>
        event.startStep === index &&
        event.durationSteps === 1 &&
        event.eventType === "hit",
    )
  ) {
    return "sixteenths";
  }

  return undefined;
}
