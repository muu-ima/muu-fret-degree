import { getProgressionCellForBeat } from "./progression-harmony";
import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionBeat,
  type ProgressionCell,
  type ProgressionPlaybackState,
  type ProgressionPosition,
  type ProgressionSelection,
  type TimeSignature,
} from "./progression-model";

export {
  createDefaultProgression,
  makeProgressionBar,
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionBeat,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionPlaybackState,
  type ProgressionPosition,
  type ProgressionRhythmEvent,
  type ProgressionSelection,
  type ProgressionSubdivision,
  type TimeSignature,
} from "./progression-model";

export {
  getProgressionBeat,
  getProgressionCellForBeat,
  makeProgressionBeats,
  updateProgressionBeatChord,
  updateProgressionCell,
} from "./progression-harmony";

export {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionBeatSubdivision,
  getProgressionRhythmEventAtStep,
  getProgressionRhythmEvents,
  getProgressionSustainingEventAtStep,
} from "./progression-rhythm";

export { canSetProgressionRhythmDuration } from "./progression-rhythm-collision";

export {
  applyProgressionBeatSubdivision,
  removeProgressionRhythmEvent,
  updateProgressionBeatDuration,
  updateProgressionBeatEventType,
  updateProgressionRhythmEvent,
} from "./progression-rhythm-commands";

export {
  canTieProgressionBeat,
  countFollowingProgressionTies,
  getRelativeBeatLocation,
} from "./progression-ties";

function normalizeNonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function secondsPerBeat(bpm: number, beatUnit = 4) {
  const normalizedBpm = normalizeNonNegative(bpm);
  const normalizedBeatUnit = normalizeNonNegative(beatUnit);

  if (normalizedBpm === 0 || normalizedBeatUnit === 0) {
    return 0;
  }

  return (60 / normalizedBpm) * (4 / normalizedBeatUnit);
}

export function secondsPerBar(bpm: number, timeSignature: TimeSignature) {
  return secondsPerBeat(bpm, timeSignature.beatUnit) *
    normalizeNonNegative(timeSignature.beatsPerBar);
}

export function getProgressionPosition(
  elapsedSeconds: number,
  bpm: number,
  timeSignature: TimeSignature,
): ProgressionPosition {
  const safeElapsedSeconds = Math.max(0, elapsedSeconds);
  const beatLength = secondsPerBeat(bpm, timeSignature.beatUnit);
  const barLength = secondsPerBar(bpm, timeSignature);

  if (beatLength === 0 || barLength === 0) {
    return {
      elapsedSeconds: safeElapsedSeconds,
      beatIndex: 0,
      barIndex: 0,
      beatInBar: 0,
      stepIndex: 0,
      stepInBeat: 0,
      stepInBar: 0,
    };
  }

  const beatIndex = Math.floor(safeElapsedSeconds / beatLength);
  const barIndex = Math.floor(safeElapsedSeconds / barLength);
  const stepLength = beatLength / progressionStepsPerBeat;
  const stepIndex = Math.floor(safeElapsedSeconds / stepLength);
  const beatsPerBar = Math.max(1, Math.floor(timeSignature.beatsPerBar));

  return {
    elapsedSeconds: safeElapsedSeconds,
    beatIndex,
    barIndex,
    beatInBar: beatIndex % beatsPerBar,
    stepIndex,
    stepInBeat: stepIndex % progressionStepsPerBeat,
    stepInBar: stepIndex % (beatsPerBar * progressionStepsPerBeat),
  };
}

export function isProgressionBeatStart(position: ProgressionPosition) {
  return position.stepInBeat === 0;
}

export function getCurrentProgressionBar(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionBar | undefined {
  return getProgressionPlaybackState(progression, elapsedSeconds).selection?.bar;
}

export function getCurrentProgressionSelection(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionSelection | undefined {
  return getProgressionPlaybackState(progression, elapsedSeconds).selection;
}

export function getProgressionPlaybackState(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionPlaybackState {
  const position = getProgressionPosition(elapsedSeconds, progression.bpm, progression.timeSignature);

  if (progression.bars.length === 0) {
    return { position };
  }

  const bar = progression.bars[position.barIndex % progression.bars.length];
  const cellIndex = Math.min(Math.floor(position.beatInBar / 2), bar.cells.length - 1);

  return {
    position,
    selection: {
      bar,
      cell: getProgressionCellForBeat(bar, position.beatInBar),
      cellIndex,
    },
  };
}

export function resizeProgressionBars(bars: readonly ProgressionBar[], nextLength: number) {
  if (nextLength <= 0 || bars.length === 0) {
    return [];
  }

  return Array.from({ length: nextLength }, (_, index) => ({
    bar: index + 1,
    cells: bars[index % bars.length].cells.map((cell) => ({ ...cell })) as [
      ProgressionCell,
      ProgressionCell,
    ],
    ...(bars[index % bars.length].beats
      ? {
          beats: bars[index % bars.length].beats?.map((beat) => ({
            ...beat,
            ...(beat.chordOverride ? { chordOverride: { ...beat.chordOverride } } : {}),
          })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat],
        }
      : {}),
    ...(bars[index % bars.length].rhythm
      ? { rhythm: bars[index % bars.length].rhythm?.map((event) => ({ ...event })) }
      : {}),
  }));
}

export function updateProgressionBarCount(
  progression: ChordProgression,
  nextBarCount: number,
): ChordProgression {
  if (progression.bars.length === nextBarCount) {
    return progression;
  }

  return {
    ...progression,
    bars: resizeProgressionBars(progression.bars, nextBarCount),
  };
}
