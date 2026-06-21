import { describe, expect, it } from "vitest";
import type { ChordNote, FretNote } from "../music";
import type { ProgressionBeatEventType, ProgressionDurationSteps } from "./model";
import {
  planProgressionBeat,
  type ProgressionRhythm,
} from "./playback";

const chordNotes: ChordNote[] = [
  { degree: "1", semitones: 0, note: "C" },
  { degree: "3", semitones: 4, note: "E" },
  { degree: "5", semitones: 7, note: "G" },
  { degree: "7", semitones: 11, note: "B" },
];

const fretNotes: FretNote[] = [
  makeFretNote("approach-low", 35, "B", 2),
  makeFretNote("root", 36, "C", 3, "1"),
  makeFretNote("third", 40, "E", 2, "3"),
  makeFretNote("fifth", 43, "G", 5, "5"),
  makeFretNote("seventh", 47, "B", 4, "7"),
];

function makeFretNote(
  id: string,
  midi: number,
  pitchClass: string,
  fret: number,
  degree?: string,
): FretNote {
  return {
    id,
    stringIndex: 0,
    fret,
    midi,
    pitchClass,
    note: pitchClass,
    degree,
    inChord: degree !== undefined,
  };
}

function plan(
  rhythm: ProgressionRhythm,
  beatInBar: number,
  nextRoot?: string,
  beatEventType?: ProgressionBeatEventType,
  followingTieBeats?: number,
  durationSteps?: ProgressionDurationSteps,
  durationSeconds?: number,
) {
  return planProgressionBeat({
    beatInBar,
    beatEventType,
    bpm: 120,
    chordNotes,
    durationSeconds,
    durationSteps,
    followingTieBeats,
    nextRoot,
    notes: fretNotes,
    rhythm,
  });
}

describe("progression playback patterns", () => {
  it.each([
    ["root-only", 0, [36]],
    ["chord-tones", 1, [40]],
    ["degree-ascending", 0, [36, 40]],
    ["degree-third-first", 0, [40, 36]],
    ["four-beat", 1, [43]],
  ] satisfies [ProgressionRhythm, number, number[]][]) (
    "%s plans the expected notes",
    (rhythm, beatInBar, expectedMidi) => {
      expect(plan(rhythm, beatInBar).map((event) => event.midi)).toEqual(expectedMidi);
    },
  );

  it("approaches the next Root from a semitone below on beat four", () => {
    const events = plan("four-beat", 3, "C");

    expect(events).toEqual([{ midi: 35, startOffset: 0, duration: 0.5 }]);
  });

  it("uses BPM to schedule two degree notes within one beat", () => {
    const events = plan("degree-ascending", 0);

    expect(events[0]).toMatchObject({ startOffset: 0, duration: 0.22 });
    expect(events[1]).toMatchObject({ startOffset: 0.25, duration: 0.25 });
  });

  it.each(
    (["rest", "tie"] as const).flatMap((eventType) =>
      (
        [
          "root-only",
          "chord-tones",
          "degree-ascending",
          "degree-third-first",
          "four-beat",
        ] satisfies ProgressionRhythm[]
      ).map((rhythm) => [rhythm, eventType] as const),
    ),
  )("%s produces no notes for a %s", (rhythm, eventType) => {
    expect(plan(rhythm, 0, undefined, eventType)).toEqual([]);
  });

  it("extends a single note through following tie beats", () => {
    const events = plan("root-only", 0, undefined, "hit", 2);

    expect(events).toEqual([{ midi: 36, startOffset: 0, duration: 1.5 }]);
  });

  it("extends only the last note of a degree flow", () => {
    const events = plan("degree-ascending", 0, undefined, "hit", 1);

    expect(events[0]).toMatchObject({ midi: 36, duration: 0.22 });
    expect(events[1]).toMatchObject({ midi: 40, duration: 0.75 });
  });

  it.each([
    [1, 0.125],
    [2, 0.25],
    [3, 0.375],
    [4, 0.5],
    [6, 0.75],
  ] satisfies [ProgressionDurationSteps, number][])(
    "%s steps produce a %s second gate at 120 BPM",
    (durationSteps, expectedDuration) => {
      const events = plan("root-only", 0, undefined, "hit", 0, durationSteps);
      expect(events[0].duration).toBe(expectedDuration);
    },
  );

  it("keeps only degree notes that start inside the selected value", () => {
    const events = plan("degree-ascending", 0, undefined, "hit", 0, 1);

    expect(events).toEqual([{ midi: 36, startOffset: 0, duration: 0.125 }]);
  });

  it("uses a groove-adjusted gate instead of the straight step duration", () => {
    const longEighth = plan("root-only", 0, undefined, "hit", 0, 2, 1 / 3);
    const shortEighth = plan("root-only", 0, undefined, "hit", 0, 2, 1 / 6);

    expect(longEighth[0].duration).toBeCloseTo(1 / 3);
    expect(shortEighth[0].duration).toBeCloseTo(1 / 6);
  });

  it("keeps internal pattern notes that fit inside a groove-adjusted gate", () => {
    const events = plan("degree-ascending", 0, undefined, "hit", 0, 2, 1 / 3);

    expect(events.map((event) => event.midi)).toEqual([36, 40]);
    expect(events[1].duration).toBeCloseTo(1 / 12);
  });
});
