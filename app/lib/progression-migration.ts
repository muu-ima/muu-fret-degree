import type {
  ProgressionBar,
  ProgressionBeat,
  ProgressionBeatEventType,
  ProgressionCell,
  ProgressionDurationSteps,
} from "./progression";

export type LegacyBeatRhythm = ProgressionBeat & {
  durationSteps?: ProgressionDurationSteps;
  eventType?: ProgressionBeatEventType;
};

export function migrateBeatRhythmToEvents(bars: readonly ProgressionBar[]): ProgressionBar[] {
  return bars.map((bar) => {
    const legacyBeats = bar.beats as readonly LegacyBeatRhythm[] | undefined;
    const rhythm =
      legacyBeats?.flatMap((beat, beatIndex) => {
        const durationSteps = beat.durationSteps ?? 4;
        const eventType = beat.eventType ?? "hit";
        return durationSteps === 4 && eventType === "hit"
          ? []
          : [{ startStep: beatIndex * 4, durationSteps, eventType }];
      }) ?? [];
    const beats = legacyBeats?.map((beat) =>
      beat.chordOverride ? { chordOverride: { ...beat.chordOverride } } : {},
    ) as [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat] | undefined;
    const hasChordOverrides = beats?.some((beat) => beat.chordOverride !== undefined);

    return {
      bar: bar.bar,
      cells: bar.cells.map((cell) => ({ ...cell })) as [ProgressionCell, ProgressionCell],
      ...(hasChordOverrides ? { beats } : {}),
      ...(rhythm.length > 0 ? { rhythm } : {}),
    };
  });
}
