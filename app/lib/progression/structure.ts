import type {
  ChordProgression,
  ProgressionBar,
  ProgressionBeat,
  ProgressionCell,
} from "./model";

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
