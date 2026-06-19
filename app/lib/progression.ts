export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type ProgressionCell = {
  root: string;
  chordTypeId: string;
};

export type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
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

export type ProgressionSelection = {
  bar: ProgressionBar;
  cell: ProgressionCell;
  cellIndex: number;
};

export type ProgressionPlaybackState = {
  position: ProgressionPosition;
  selection?: ProgressionSelection;
};

export function createDefaultProgression(bpm = 120): ChordProgression {
  return {
    bpm,
    timeSignature: { beatsPerBar: 4, beatUnit: 4 },
    bars: [
      makeProgressionBar(1, { root: "C", chordTypeId: "maj7" }),
      makeProgressionBar(2, { root: "A", chordTypeId: "m7" }),
      makeProgressionBar(3, { root: "D", chordTypeId: "m7" }),
      makeProgressionBar(4, { root: "G", chordTypeId: "7" }),
    ],
  };
}

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
      cell: bar.cells[cellIndex],
      cellIndex,
    },
  };
}

export function resizeProgressionBars(bars: readonly ProgressionBar[], nextLength: number) {
  if (nextLength <= 0) {
    return [];
  }
  if (bars.length === 0) {
    return [];
  }

  return Array.from({ length: nextLength }, (_, index) => ({
    bar: index + 1,
    cells: bars[index % bars.length].cells.map((cell) => ({ ...cell })) as [
      ProgressionCell,
      ProgressionCell,
    ],
  }));
}

export function makeProgressionBar(
  bar: number,
  firstCell: ProgressionCell,
  secondCell: ProgressionCell = firstCell,
): ProgressionBar {
  return {
    bar,
    cells: [{ ...firstCell }, { ...secondCell }],
  };
}
