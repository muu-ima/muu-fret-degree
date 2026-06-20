import type {
  ChordProgression,
  ProgressionBar,
  ProgressionBeat,
  ProgressionCell,
} from "./progression-model";

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
  const hasBeatData = nextBeats.some(hasProgressionBeatData);

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

function removeBeatChordOverride(beat: ProgressionBeat): ProgressionBeat {
  const { chordOverride: _chordOverride, ...beatWithoutChordOverride } = beat;
  return beatWithoutChordOverride;
}

function hasProgressionBeatData(beat: ProgressionBeat) {
  return beat.chordOverride !== undefined;
}
