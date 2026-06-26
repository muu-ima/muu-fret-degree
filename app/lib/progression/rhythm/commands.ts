import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionBar,
} from "../model";
import {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionRhythmEventAtStep,
  getProgressionRhythmPreset,
  getProgressionSustainingEventAtStep,
} from "./queries";
import { canSetProgressionRhythmDuration } from "./collision";
import {
  addProgressionCrossBarTie,
  isCrossBarDottedQuarter,
  removeProgressionCrossBarTie,
  shortenProgressionCrossBarSource,
} from "./boundary";
import {
  removeExplicitProgressionRhythmEvent,
  setProgressionRhythmEvent,
} from "./store";
import { canTieProgressionBeat, getRelativeBeatLocation } from "./ties";
import {
  createProgressionVirtualTimeline,
  validateProgressionRhythmPlacementAtPosition,
} from "./timeline";
import {
  getProgressionRhythmPresetDefinition,
  getProgressionRhythmPresetSpanSteps,
  getProgressionRhythmPresetSpanTicks,
  getProgressionRhythmPresetStartBeat,
  getProgressionRhythmPresetStepEvents,
  getProgressionRhythmPresetTickEvents,
  type ProgressionRhythmPresetId,
  type ProgressionSubdivision,
} from "./presets";
import { progressionTicksPerBeat } from "./timing-grid";
import type { ProgressionRhythmTickEvent } from "./ticks";

const progressionStepsPerBar = progressionStepsPerBeat * 4;
const progressionBeatCountPerBar = progressionStepsPerBar / progressionStepsPerBeat;
const progressionCrossBarDottedQuarterStartStep = progressionStepsPerBeat * 3;
const progressionCrossBarDottedQuarterDurationSteps =
  progressionStepsPerBeat + progressionStepsPerBeat / 2;
const progressionBarStartStep = 0;

type ProgressionBarWithTickRhythm = ProgressionBar & {
  tickRhythm?: readonly ProgressionRhythmTickEvent[];
};

function isProgressionBeatIndex(beatIndex: number) {
  return beatIndex >= 0 && beatIndex < progressionBeatCountPerBar;
}

function applyProgressionRhythmPresetEvents(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
  endStep: number,
  startTick: number,
  endTick: number,
  presetEvents: readonly {
    startStep: number;
    durationSteps: ProgressionDurationSteps;
    eventType: ProgressionBeatEventType;
  }[],
) {
  const updatedBar = progression.bars[barIndex] as ProgressionBarWithTickRhythm;
  const nextRhythm = [
    ...(updatedBar.rhythm?.filter(
      (event) => event.startStep < startStep || event.startStep >= endStep,
    ) ?? []),
    ...presetEvents.map((event) => ({
      ...event,
      startStep: startStep + event.startStep,
    })),
  ].sort((first, second) => first.startStep - second.startStep);
  const nextTickRhythm = updatedBar.tickRhythm?.filter(
    (event) => event.startTick < startTick || event.startTick >= endTick,
  );

  return {
    ...progression,
    bars: progression.bars.map((bar, index) =>
      index === barIndex
        ? {
            ...bar,
            ...(nextRhythm.length > 0 ? { rhythm: nextRhythm } : {}),
            ...(nextTickRhythm && nextTickRhythm.length > 0
              ? { tickRhythm: nextTickRhythm }
              : {}),
          }
        : bar,
    ),
  };
}

function applyProgressionRhythmPresetTickEvents(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
  endStep: number,
  startTick: number,
  endTick: number,
  presetTickEvents: readonly ProgressionRhythmTickEvent[],
) {
  const updatedBar = progression.bars[barIndex] as ProgressionBarWithTickRhythm;
  const nextRhythm = updatedBar.rhythm?.filter(
    (event) => event.startStep < startStep || event.startStep >= endStep,
  );
  const nextTickRhythm = [
    ...(updatedBar.tickRhythm?.filter(
      (event) => event.startTick < startTick || event.startTick >= endTick,
    ) ?? []),
    ...presetTickEvents.map((event) => ({
      ...event,
      startTick: startTick + event.startTick,
    })),
  ].sort((first, second) => first.startTick - second.startTick);

  return {
    ...progression,
    bars: progression.bars.map((bar, index) =>
      index === barIndex
        ? {
            ...bar,
            ...(nextRhythm && nextRhythm.length > 0 ? { rhythm: nextRhythm } : {}),
            tickRhythm: nextTickRhythm,
          }
        : bar,
    ),
  };
}

export function updateProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  if (eventType === "tie" && !canTieProgressionBeat(progression.bars, barIndex, beatIndex)) {
    return progression;
  }

  let nextProgression = setProgressionBeatEventType(progression, barIndex, beatIndex, eventType);
  if (eventType !== "rest") {
    return nextProgression;
  }

  const totalBeats = progression.bars.length * progressionBeatCountPerBar;
  for (let offset = 1; offset < totalBeats; offset += 1) {
    const nextLocation = getRelativeBeatLocation(
      nextProgression.bars,
      barIndex,
      beatIndex,
      offset,
    );
    if (!nextLocation) {
      break;
    }

    const nextEventType = getProgressionBeatEventType(
      nextProgression.bars[nextLocation.barIndex],
      nextLocation.beatIndex,
    );
    if (nextEventType !== "tie") {
      break;
    }

    nextProgression = setProgressionBeatEventType(
      nextProgression,
      nextLocation.barIndex,
      nextLocation.beatIndex,
      "rest",
    );
  }

  return nextProgression;
}

function setProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || !isProgressionBeatIndex(beatIndex)) {
    return progression;
  }

  if (getProgressionBeatEventType(currentBar, beatIndex) === eventType) {
    return progression;
  }

  return updateProgressionRhythmEvent(
    progression,
    barIndex,
    beatIndex * progressionStepsPerBeat,
    eventType,
    getProgressionBeatDuration(currentBar, beatIndex),
  );
}

export function updateProgressionBeatDuration(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  durationSteps: ProgressionDurationSteps,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || !isProgressionBeatIndex(beatIndex)) {
    return progression;
  }
  if (getProgressionBeatDuration(currentBar, beatIndex) === durationSteps) {
    return progression;
  }

  return updateProgressionRhythmEvent(
    progression,
    barIndex,
    beatIndex * progressionStepsPerBeat,
    getProgressionBeatEventType(currentBar, beatIndex),
    durationSteps,
  );
}

export function updateProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
  eventType: ProgressionBeatEventType,
  durationSteps: ProgressionDurationSteps,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  const nextBarIndex = progression.bars.length > 0
    ? (barIndex + 1) % progression.bars.length
    : barIndex;
  const nextBar = progression.bars[nextBarIndex];
  const placementValidation = validateProgressionRhythmPlacementAtPosition(
    createProgressionVirtualTimeline(progression),
    barIndex,
    startStep,
    durationSteps,
  );
  if (
    !currentBar ||
    !canSetProgressionRhythmDuration(currentBar, startStep, durationSteps, nextBar) ||
    !placementValidation.canPlace
  ) {
    return progression;
  }

  const currentEvent = getProgressionRhythmEventAtStep(currentBar, startStep);
  if (currentEvent?.eventType === eventType && currentEvent.durationSteps === durationSteps) {
    return progression;
  }

  let nextProgression = progression;
  const wasCrossBarDottedQuarter = isCrossBarDottedQuarter(currentEvent);
  const willCrossBarDottedQuarter =
    startStep === progressionCrossBarDottedQuarterStartStep &&
    eventType === "hit" &&
    durationSteps === progressionCrossBarDottedQuarterDurationSteps;

  if (wasCrossBarDottedQuarter && !willCrossBarDottedQuarter) {
    nextProgression = removeProgressionCrossBarTie(nextProgression, barIndex);
  }

  if (startStep === progressionBarStartStep && eventType !== "tie" && progression.bars.length > 0) {
    nextProgression = shortenProgressionCrossBarSource(nextProgression, barIndex);
  }

  nextProgression = setProgressionRhythmEvent(nextProgression, barIndex, {
    startStep,
    durationSteps,
    eventType,
  });

  return willCrossBarDottedQuarter
    ? addProgressionCrossBarTie(nextProgression, barIndex)
    : nextProgression;
}

export function removeProgressionRhythmEvent(
  progression: ChordProgression,
  barIndex: number,
  startStep: number,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (
    !currentBar ||
    startStep % progressionStepsPerBeat === 0 ||
    !currentBar.rhythm?.some((event) => event.startStep === startStep)
  ) {
    return progression;
  }
  return removeExplicitProgressionRhythmEvent(progression, barIndex, startStep);
}

export function applyProgressionBeatSubdivision(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  subdivision: ProgressionSubdivision,
): ChordProgression {
  return applyProgressionRhythmPreset(progression, barIndex, beatIndex, subdivision);
}

export function applyProgressionRhythmPreset(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  presetId: ProgressionRhythmPresetId,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  const preset = getProgressionRhythmPresetDefinition(presetId);
  if (!currentBar || !preset || !isProgressionBeatIndex(beatIndex)) {
    return progression;
  }
  if (getProgressionRhythmPreset(currentBar, beatIndex) === presetId) {
    return progression;
  }

  const startBeat = getProgressionRhythmPresetStartBeat(preset, beatIndex);
  const startStep = startBeat * progressionStepsPerBeat;
  const endStep = startStep + getProgressionRhythmPresetSpanSteps(preset);
  const startTick = startBeat * progressionTicksPerBeat;
  const endTick = startTick + getProgressionRhythmPresetSpanTicks(preset);
  let nextProgression = progression;
  const presetEvents = getProgressionRhythmPresetStepEvents(preset);
  const presetTickEvents = getProgressionRhythmPresetTickEvents(preset);

  if (startBeat === 0) {
    nextProgression = shortenProgressionCrossBarSource(nextProgression, barIndex);
  } else if (preset.spanBeats > 1) {
    const sustainingEvent = getProgressionSustainingEventAtStep(currentBar, startStep);
    if (sustainingEvent) {
      nextProgression = setProgressionRhythmEvent(nextProgression, barIndex, {
        ...sustainingEvent,
        durationSteps: 4,
      });
    }
  }

  if (
    currentBar.rhythm?.some(
      (event) =>
        event.startStep >= startStep &&
        event.startStep < endStep &&
        isCrossBarDottedQuarter(event),
    )
  ) {
    nextProgression = removeProgressionCrossBarTie(nextProgression, barIndex);
  }

  if (preset.timingGrid === "triplet") {
    return applyProgressionRhythmPresetTickEvents(
      nextProgression,
      barIndex,
      startStep,
      endStep,
      startTick,
      endTick,
      presetTickEvents,
    );
  }

  if (!presetEvents) {
    return progression;
  }

  return applyProgressionRhythmPresetEvents(
    nextProgression,
    barIndex,
    startStep,
    endStep,
    startTick,
    endTick,
    presetEvents,
  );
}
