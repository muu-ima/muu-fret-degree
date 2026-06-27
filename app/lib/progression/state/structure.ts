import type {
  ChordProgression,
  ProgressionBar,
  ProgressionBeat,
  ProgressionCell,
} from "../model";
import type { ProgressionRhythmTickEvent } from "../rhythm/ticks";

type ProgressionBarWithTickRhythm = ProgressionBar & {
  tickRhythm?: readonly ProgressionRhythmTickEvent[];
};

export function resizeProgressionBars(bars: readonly ProgressionBar[], nextLength: number) {
  if (nextLength <= 0) {
    return [];
  }
  if (bars.length === 0) {
    return [];
  }

  return Array.from({ length: nextLength }, (_, index) => {
    const sourceBar = bars[index % bars.length] as ProgressionBarWithTickRhythm;

    return {
      bar: index + 1,
      cells: sourceBar.cells.map((cell) => ({ ...cell })) as [
        ProgressionCell,
        ProgressionCell,
      ],
      ...(sourceBar.beats
        ? {
            beats: sourceBar.beats?.map((beat) => ({
              ...beat,
              ...(beat.chordOverride ? { chordOverride: { ...beat.chordOverride } } : {}),
            })) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat],
          }
        : {}),
      ...(sourceBar.rhythm
        ? { rhythm: sourceBar.rhythm?.map((event) => ({ ...event })) }
        : {}),
      ...(sourceBar.tickRhythm
        ? { tickRhythm: sourceBar.tickRhythm?.map((event) => ({ ...event })) }
        : {}),
    };
  });
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

