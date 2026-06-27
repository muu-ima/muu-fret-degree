import { getProgressionCellForBeat } from "../harmony";
import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionPosition,
} from "../model";
import { countFollowingProgressionTies } from "../rhythm/ties";
import {
  createProgressionVirtualTimeline,
  getProgressionVirtualRhythmEventAtPosition,
  type ProgressionVirtualTimeline,
} from "../rhythm/timeline";
import { progressionTicksPerBeat } from "../rhythm/timing-grid";
import { progressionTicksPerStep } from "../rhythm/ticks";
import { getProgressionTickRhythmEventAtTick } from "../rhythm/queries";

function getProgressionBeatEndStep(
  virtualStartStep: number,
  stepInBeat: number,
) {
  return virtualStartStep + (progressionStepsPerBeat - stepInBeat);
}

function hasLaterEventInBeat(
  timeline: ProgressionVirtualTimeline,
  virtualStartStep: number,
  beatEndStep: number,
) {
  return timeline.events.some(
    (event) =>
      event.absoluteStartStep > virtualStartStep &&
      event.absoluteStartStep < beatEndStep,
  );
}

function getProgressionStepPlaybackContext(
  progression: ChordProgression,
  position: ProgressionPosition,
  timeline: ProgressionVirtualTimeline,
) {
  const bars = progression.bars;
  const currentBarIndex = position.barIndex % bars.length;
  const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
  const nextBeatInBar = (position.beatInBar + 1) % beatsPerBar;
  const nextBarIndex = nextBeatInBar === 0
    ? (currentBarIndex + 1) % bars.length
    : currentBarIndex;
  const virtualEvent = getProgressionVirtualRhythmEventAtPosition(
    timeline,
    currentBarIndex,
    position.stepInBar,
  );
  if (!virtualEvent) {
    return undefined;
  }

  const beatEndStep = getProgressionBeatEndStep(
    virtualEvent.absoluteStartStep,
    position.stepInBeat,
  );

  return {
    beatEndStep,
    currentBarIndex,
    nextBarIndex,
    nextBeatInBar,
    rhythmEvent: virtualEvent.event,
    virtualEvent,
  };
}

export function getProgressionStepPlaybackRequest(
  progression: ChordProgression,
  position: ProgressionPosition,
  timeline: ProgressionVirtualTimeline = createProgressionVirtualTimeline(progression),
) {
  const bars = progression.bars;
  if (bars.length === 0) {
    return undefined;
  }

  const playbackContext = getProgressionStepPlaybackContext(
    progression,
    position,
    timeline,
  );
  if (!playbackContext) {
    return undefined;
  }
  const { beatEndStep, currentBarIndex, nextBarIndex, nextBeatInBar, rhythmEvent, virtualEvent } =
    playbackContext;
  const beatHasLaterEvent = hasLaterEventInBeat(
    timeline,
    virtualEvent.absoluteStartStep,
    beatEndStep,
  );

  return {
    beatInBar: position.beatInBar,
    beatEventType: rhythmEvent.eventType,
    durationSteps: rhythmEvent.durationSteps,
    followingTieBeats: !beatHasLaterEvent && rhythmEvent.durationSteps <= progressionStepsPerBeat
      ? countFollowingProgressionTies(
          progression,
          currentBarIndex,
          position.beatInBar,
        )
      : 0,
    nextRoot: getProgressionCellForBeat(bars[nextBarIndex], nextBeatInBar).root,
    startStep: position.stepInBar,
    stepInBeat: position.stepInBeat,
  };
}

export function getProgressionTickPlaybackRequest(
  progression: ChordProgression,
  tickIndex: number,
) {
  const bars = progression.bars;
  if (bars.length === 0 || !Number.isInteger(tickIndex) || tickIndex < 0) {
    return undefined;
  }

  const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
  const ticksPerBar = beatsPerBar * progressionTicksPerBeat;
  const ticksPerLoop = bars.length * ticksPerBar;
  const loopTickIndex = tickIndex % ticksPerLoop;
  const barIndex = Math.floor(loopTickIndex / ticksPerBar);
  const tickInBar = loopTickIndex % ticksPerBar;
  const beatInBar = Math.floor(tickInBar / progressionTicksPerBeat);
  const currentBar = bars[barIndex];

  if (!currentBar) {
    return undefined;
  }

  const rhythmEvent = getProgressionTickRhythmEventAtTick(currentBar, tickInBar);
  if (!rhythmEvent) {
    return undefined;
  }

  const nextBeatInBar = (beatInBar + 1) % beatsPerBar;
  const nextBarIndex = nextBeatInBar === 0
    ? (barIndex + 1) % bars.length
    : barIndex;
  const secondsPerBeat = (60 / Math.max(1, progression.bpm)) * (4 / Math.max(1, progression.timeSignature.beatUnit));
  const secondsPerTick = secondsPerBeat / progressionTicksPerBeat;

  return {
    beatInBar,
    beatEventType: rhythmEvent.eventType,
    durationSteps: undefined,
    durationSeconds: rhythmEvent.durationTicks * secondsPerTick,
    followingTieBeats: 0,
    nextRoot: getProgressionCellForBeat(bars[nextBarIndex], nextBeatInBar).root,
    startStep: Math.floor(tickInBar / progressionTicksPerStep),
    stepInBeat: Math.floor((tickInBar % progressionTicksPerBeat) / progressionTicksPerStep),
  };
}
