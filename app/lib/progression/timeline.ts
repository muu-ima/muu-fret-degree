import { getProgressionCellForBeat } from "./harmony";
import {
  progressionStepsPerBeat,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionPlaybackState,
  type ProgressionPosition,
  type ProgressionSelection,
  type TimeSignature,
} from "./model";

function normalizeNonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getNormalizedProgressionTimeSignature(timeSignature: TimeSignature) {
  return {
    beatsPerBar: normalizeNonNegative(timeSignature.beatsPerBar),
    beatUnit: normalizeNonNegative(timeSignature.beatUnit),
  };
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
  const normalizedTimeSignature = getNormalizedProgressionTimeSignature(timeSignature);
  return secondsPerBeat(bpm, normalizedTimeSignature.beatUnit) *
    normalizedTimeSignature.beatsPerBar;
}

export function getProgressionPosition(
  elapsedSeconds: number,
  bpm: number,
  timeSignature: TimeSignature,
): ProgressionPosition {
  const safeElapsedSeconds = Math.max(0, elapsedSeconds);
  const normalizedTimeSignature = getNormalizedProgressionTimeSignature(timeSignature);
  const beatLength = secondsPerBeat(bpm, normalizedTimeSignature.beatUnit);
  const barLength = secondsPerBar(bpm, normalizedTimeSignature);

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
  const beatsPerBar = Math.max(1, Math.floor(normalizedTimeSignature.beatsPerBar));

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
