import { getProgressionCellForBeat } from "./harmony";
import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionPosition,
} from "./model";
import { countFollowingProgressionTies } from "./rhythm/ties";
import {
  createProgressionVirtualTimeline,
  getProgressionVirtualRhythmEventAtPosition,
  type ProgressionVirtualTimeline,
} from "./rhythm/timeline";
import {
  getProgressionTickPosition,
  progressionTicksPerStep,
} from "./rhythm/ticks";

function getProgressionBeatEndTick(
  virtualStartTick: number,
  tickInBeat: number,
) {
  return virtualStartTick + (progressionStepsPerBeat * progressionTicksPerStep - tickInBeat);
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

  const tickPosition = getProgressionTickPosition(position);
  const beatEndTick = getProgressionBeatEndTick(
    virtualEvent.absoluteStartStep * progressionTicksPerStep,
    tickPosition.tickInBeat,
  );
  const beatEndStep = beatEndTick / progressionTicksPerStep;

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
