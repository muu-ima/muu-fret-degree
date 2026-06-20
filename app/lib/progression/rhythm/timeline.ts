import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionDurationSteps,
  type ProgressionRhythmEvent,
} from "../model";
import { getProgressionRhythmEvents } from "./queries";

export const progressionStepsPerBar = progressionStepsPerBeat * 4;
export const progressionVirtualLoopCount = 2;

export type ProgressionVirtualRhythmEvent = {
  absoluteEndStep: number;
  absoluteStartStep: number;
  barIndex: number;
  event: ProgressionRhythmEvent;
  isExplicit: boolean;
  loopIndex: number;
};

export type ProgressionVirtualTimeline = {
  events: readonly ProgressionVirtualRhythmEvent[];
  stepsPerLoop: number;
  totalSteps: number;
};

export type ProgressionPlacementCollisionReason =
  | "outside-timeline"
  | "occupied-by-prior-event"
  | "overlaps-following-event";

export type ProgressionPlacementValidation =
  | { canPlace: true }
  | {
      canPlace: false;
      conflictingEvent?: ProgressionVirtualRhythmEvent;
      reason: ProgressionPlacementCollisionReason;
    };

export function createProgressionVirtualTimeline(
  progression: ChordProgression,
): ProgressionVirtualTimeline {
  const stepsPerLoop = progression.bars.length * progressionStepsPerBar;
  const totalSteps = stepsPerLoop * progressionVirtualLoopCount;
  const candidates = Array.from(
    { length: progressionVirtualLoopCount },
    (_, loopIndex) =>
      progression.bars.flatMap((bar, barIndex) =>
        getProgressionRhythmEvents(bar).map((event) => {
          const absoluteStartStep =
            loopIndex * stepsPerLoop +
            barIndex * progressionStepsPerBar +
            event.startStep;
          return {
            absoluteEndStep: absoluteStartStep + event.durationSteps,
            absoluteStartStep,
            barIndex,
            event,
            isExplicit: bar.rhythm?.some(
              (explicitEvent) => explicitEvent.startStep === event.startStep,
            ) ?? false,
            loopIndex,
          };
        }),
      ),
  ).flat();

  const events = candidates.reduce<ProgressionVirtualRhythmEvent[]>((accepted, candidate) => {
    const previousEvent = accepted.at(-1);
    if (previousEvent && candidate.absoluteStartStep < previousEvent.absoluteEndStep) {
      return accepted;
    }

    accepted.push(candidate);
    return accepted;
  }, []);

  return { events, stepsPerLoop, totalSteps };
}

export function validateProgressionRhythmPlacement(
  timeline: ProgressionVirtualTimeline,
  absoluteStartStep: number,
  durationSteps: ProgressionDurationSteps,
): ProgressionPlacementValidation {
  if (
    !Number.isInteger(absoluteStartStep) ||
    absoluteStartStep < 0 ||
    absoluteStartStep >= timeline.totalSteps ||
    absoluteStartStep + durationSteps > timeline.totalSteps
  ) {
    return { canPlace: false, reason: "outside-timeline" };
  }

  const occupyingEvent = timeline.events.find(
    (event) =>
      event.absoluteStartStep < absoluteStartStep &&
      event.absoluteEndStep > absoluteStartStep,
  );
  if (occupyingEvent) {
    return {
      canPlace: false,
      conflictingEvent: occupyingEvent,
      reason: "occupied-by-prior-event",
    };
  }

  const followingEvent = timeline.events.find(
    (event) =>
      event.isExplicit &&
      event.absoluteStartStep > absoluteStartStep &&
      event.absoluteStartStep < absoluteStartStep + durationSteps,
  );
  if (followingEvent) {
    return {
      canPlace: false,
      conflictingEvent: followingEvent,
      reason: "overlaps-following-event",
    };
  }

  return { canPlace: true };
}

export function validateProgressionRhythmPlacementAtPosition(
  timeline: ProgressionVirtualTimeline,
  barIndex: number,
  startStep: number,
  durationSteps: ProgressionDurationSteps,
): ProgressionPlacementValidation {
  const barCount = timeline.stepsPerLoop / progressionStepsPerBar;
  if (
    !Number.isInteger(barIndex) ||
    barIndex < 0 ||
    barIndex >= barCount ||
    !Number.isInteger(startStep) ||
    startStep < 0 ||
    startStep >= progressionStepsPerBar
  ) {
    return { canPlace: false, reason: "outside-timeline" };
  }

  const firstLoopStartStep = barIndex * progressionStepsPerBar + startStep;
  const firstLoopValidation = validateProgressionRhythmPlacement(
    timeline,
    firstLoopStartStep,
    durationSteps,
  );
  if (!firstLoopValidation.canPlace) {
    return firstLoopValidation;
  }

  const secondLoopStartStep = timeline.stepsPerLoop + firstLoopStartStep;
  const priorEventValidation = validateProgressionRhythmPlacement(
    timeline,
    secondLoopStartStep,
    1,
  );
  return !priorEventValidation.canPlace &&
    priorEventValidation.reason === "occupied-by-prior-event"
    ? priorEventValidation
    : firstLoopValidation;
}

export function getProgressionVirtualRhythmEventAtPosition(
  timeline: ProgressionVirtualTimeline,
  barIndex: number,
  startStep: number,
) {
  const barCount = timeline.stepsPerLoop / progressionStepsPerBar;
  if (
    !Number.isInteger(barIndex) ||
    barIndex < 0 ||
    barIndex >= barCount ||
    !Number.isInteger(startStep) ||
    startStep < 0 ||
    startStep >= progressionStepsPerBar
  ) {
    return undefined;
  }

  const absoluteStartStep =
    timeline.stepsPerLoop + barIndex * progressionStepsPerBar + startStep;
  return timeline.events.find((event) => event.absoluteStartStep === absoluteStartStep);
}
