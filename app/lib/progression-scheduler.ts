import { getProgressionCellForBeat } from "./progression/harmony";
import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionPosition,
} from "./progression/model";
import {
  getProgressionRhythmEventAtStep,
  getProgressionRhythmEvents,
} from "./progression-rhythm";
import { countFollowingProgressionTies } from "./progression-ties";

export function getProgressionStepPlaybackRequest(
  progression: ChordProgression,
  position: ProgressionPosition,
) {
  const bars = progression.bars;
  if (bars.length === 0) {
    return undefined;
  }

  const currentBarIndex = position.barIndex % bars.length;
  const currentBar = bars[currentBarIndex];
  const rhythmEvent = getProgressionRhythmEventAtStep(currentBar, position.stepInBar);
  if (!rhythmEvent) {
    return undefined;
  }

  const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
  const nextBeatInBar = (position.beatInBar + 1) % beatsPerBar;
  const nextBarIndex = nextBeatInBar === 0
    ? (currentBarIndex + 1) % bars.length
    : currentBarIndex;
  const beatEndStep = (position.beatInBar + 1) * progressionStepsPerBeat;
  const hasLaterEventInBeat = getProgressionRhythmEvents(currentBar).some(
    (event) => event.startStep > position.stepInBar && event.startStep < beatEndStep,
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
