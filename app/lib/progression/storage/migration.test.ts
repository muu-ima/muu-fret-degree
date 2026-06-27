import { describe, expect, it } from "vitest";
import type { ProgressionBar } from "../model";
import {
  migrateBeatRhythmToEvents,
  type LegacyBeatRhythm,
} from "./migration";

describe("progression persistence migration", () => {
  it("separates legacy beat harmony from rhythm events", () => {
    const legacyBeats: [
      LegacyBeatRhythm,
      LegacyBeatRhythm,
      LegacyBeatRhythm,
      LegacyBeatRhythm,
    ] = [
      {
        chordOverride: { root: "F#", chordTypeId: "7" },
        durationSteps: 3,
        eventType: "rest",
      },
      {},
      { eventType: "tie" },
      {},
    ];
    const legacyBars = [
      {
        bar: 1,
        cells: [
          { root: "C", chordTypeId: "maj7" },
          { root: "G", chordTypeId: "7" },
        ],
        beats: legacyBeats,
      },
    ] as unknown as ProgressionBar[];

    const [migrated] = migrateBeatRhythmToEvents(legacyBars);

    expect(migrated.beats).toEqual([
      { chordOverride: { root: "F#", chordTypeId: "7" } },
      {},
      {},
      {},
    ]);
    expect(migrated.rhythm).toEqual([
      { startStep: 0, durationSteps: 3, eventType: "rest" },
      { startStep: 8, durationSteps: 4, eventType: "tie" },
    ]);
  });

  it("omits default rhythm and empty beat data", () => {
    const legacyBars = [
      {
        bar: 1,
        cells: [
          { root: "C", chordTypeId: "maj7" },
          { root: "C", chordTypeId: "maj7" },
        ],
        beats: [{}, {}, {}, {}] as LegacyBeatRhythm[],
      },
    ] as unknown as ProgressionBar[];

    const [migrated] = migrateBeatRhythmToEvents(legacyBars);

    expect(migrated.beats).toBeUndefined();
    expect(migrated.rhythm).toBeUndefined();
  });
});

