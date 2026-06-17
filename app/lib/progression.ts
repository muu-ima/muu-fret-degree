export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type ProgressionBar = {
  bar: number;
  root: string;
  chordTypeId: string;
};

export type ChordProgression = {
  bpm: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

export type ProgressionPosition = {
  elapsedSeconds: number;
  beatIndex: number;
  barIndex: number;
  beatInBar: number;
};

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
  return secondsPerBeat(bpm, timeSignature.beatUnit) * normalizeNonNegative(timeSignature.beatsPerBar);
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
    };
  }

  const beatIndex = Math.floor(safeElapsedSeconds / beatLength);
  const barIndex = Math.floor(safeElapsedSeconds / barLength);

  return {
    elapsedSeconds: safeElapsedSeconds,
    beatIndex,
    barIndex,
    beatInBar: beatIndex % Math.max(1, Math.floor(timeSignature.beatsPerBar)),
  };
}

export function getCurrentProgressionBar(
  progression: ChordProgression,
  elapsedSeconds: number,
): ProgressionBar | undefined {
  if (progression.bars.length === 0) {
    return undefined;
  }

  const position = getProgressionPosition(elapsedSeconds, progression.bpm, progression.timeSignature);
  const barIndex = Math.min(position.barIndex, progression.bars.length - 1);

  return progression.bars[barIndex];
}
