export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type ProgressionCell = {
  root: string;
  chordTypeId: string;
};

export type ProgressionBeatEventType = "hit" | "rest";

export type ProgressionBeat = {
  chordOverride?: ProgressionCell;
  eventType?: ProgressionBeatEventType;
};

export type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
  beats?: readonly [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
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
      cell: getProgressionCellForBeat(bar, position.beatInBar),
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
    ...(bars[index % bars.length].beats
      ? {
          beats: bars[index % bars.length].beats?.map((beat) => ({
            ...beat,
            ...(beat.chordOverride ? { chordOverride: { ...beat.chordOverride } } : {}),
          })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat],
        }
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

export function updateProgressionCell(
  progression: ChordProgression,
  barIndex: number,
  cellIndex: number,
  nextCell: ProgressionCell,
): ChordProgression {
  const currentCell = progression.bars[barIndex]?.cells[cellIndex];
  if (
    currentCell?.root === nextCell.root &&
    currentCell.chordTypeId === nextCell.chordTypeId
  ) {
    return progression;
  }

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      return {
        ...bar,
        cells: [
          cellIndex === 0 ? nextCell : bar.cells[0],
          cellIndex === 1 ? nextCell : bar.cells[1],
        ] as const,
      };
    }),
  };
}

export function updateProgressionBeatChord(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  nextCell: ProgressionCell | undefined,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }

  const currentOverride = currentBar.beats?.[beatIndex]?.chordOverride;
  const hasSameOverride =
    currentOverride?.root === nextCell?.root &&
    currentOverride?.chordTypeId === nextCell?.chordTypeId;
  if ((currentOverride === undefined && nextCell === undefined) || hasSameOverride) {
    return progression;
  }

  const nextBeats = makeProgressionBeats(currentBar);
  nextBeats[beatIndex] = nextCell
    ? { ...nextBeats[beatIndex], chordOverride: { ...nextCell } }
    : removeBeatChordOverride(nextBeats[beatIndex]);
  const hasBeatData = nextBeats.some(
    (beat) => beat.chordOverride !== undefined || beat.eventType !== undefined,
  );

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      if (hasBeatData) {
        return { ...bar, beats: nextBeats };
      }

      const { beats: _beats, ...barWithoutBeats } = bar;
      return barWithoutBeats;
    }),
  };
}

export function updateProgressionBeatEventType(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
  eventType: ProgressionBeatEventType,
): ChordProgression {
  const currentBar = progression.bars[barIndex];
  if (!currentBar || beatIndex < 0 || beatIndex > 3) {
    return progression;
  }

  const currentEventType = getProgressionBeatEventType(currentBar, beatIndex);
  if (currentEventType === eventType) {
    return progression;
  }

  const nextBeats = makeProgressionBeats(currentBar);
  nextBeats[beatIndex] =
    eventType === "hit"
      ? removeBeatEventType(nextBeats[beatIndex])
      : { ...nextBeats[beatIndex], eventType };
  const hasBeatData = nextBeats.some(
    (beat) => beat.chordOverride !== undefined || beat.eventType !== undefined,
  );

  return {
    ...progression,
    bars: progression.bars.map((bar, index) => {
      if (index !== barIndex) {
        return bar;
      }

      if (hasBeatData) {
        return { ...bar, beats: nextBeats };
      }

      const { beats: _beats, ...barWithoutBeats } = bar;
      return barWithoutBeats;
    }),
  };
}

export function getProgressionBeat(bar: ProgressionBar, beatIndex: number): ProgressionBeat {
  return bar.beats?.[beatIndex] ?? {};
}

export function getProgressionBeatEventType(
  bar: ProgressionBar,
  beatIndex: number,
): ProgressionBeatEventType {
  return getProgressionBeat(bar, beatIndex).eventType ?? "hit";
}

export function getProgressionCellForBeat(bar: ProgressionBar, beatIndex: number): ProgressionCell {
  const cellIndex = Math.min(Math.floor(beatIndex / 2), bar.cells.length - 1);
  return getProgressionBeat(bar, beatIndex).chordOverride ?? bar.cells[cellIndex];
}

export function makeProgressionBeats(bar: ProgressionBar): [
  ProgressionBeat,
  ProgressionBeat,
  ProgressionBeat,
  ProgressionBeat,
] {
  return [0, 1, 2, 3].map((beatIndex) => ({
    ...getProgressionBeat(bar, beatIndex),
  })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
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

function removeBeatChordOverride(beat: ProgressionBeat): ProgressionBeat {
  const { chordOverride: _chordOverride, ...beatWithoutChordOverride } = beat;
  return beatWithoutChordOverride;
}

function removeBeatEventType(beat: ProgressionBeat): ProgressionBeat {
  const { eventType: _eventType, ...beatWithoutEventType } = beat;
  return beatWithoutEventType;
}
