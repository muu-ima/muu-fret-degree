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

export function getProgressionStepPlaybackRequest(
  progression: ChordProgression,
  position: ProgressionPosition,
  timeline: ProgressionVirtualTimeline = createProgressionVirtualTimeline(progression),
) {
  const bars = progression.bars;
  if (bars.length === 0) {
    return undefined;
  }

  const currentBarIndex = position.barIndex % bars.length;
  const virtualEvent = getProgressionVirtualRhythmEventAtPosition(
    timeline,
    currentBarIndex,
    position.stepInBar,
  );
  if (!virtualEvent) {
    return undefined;
  }
  const rhythmEvent = virtualEvent.event;

  const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
  const nextBeatInBar = (position.beatInBar + 1) % beatsPerBar;
  const nextBarIndex = nextBeatInBar === 0
    ? (currentBarIndex + 1) % bars.length
    : currentBarIndex;
  const beatEndStep = virtualEvent.absoluteStartStep +
    (progressionStepsPerBeat - position.stepInBeat);
  const hasLaterEventInBeat = timeline.events.some(
    (event) =>
      event.absoluteStartStep > virtualEvent.absoluteStartStep &&
      event.absoluteStartStep < beatEndStep,
  );

  return {
    beatInBar: position.beatInBar,
    beatEventType: rhythmEvent.eventType,
    durationSteps: rhythmEvent.durationSteps,
    followingTieBeats: !hasLaterEventInBeat && rhythmEvent.durationSteps <= progressionStepsPerBeat
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
