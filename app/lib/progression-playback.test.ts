import { describe, expect, it } from "vitest";
import type { ChordNote, FretNote } from "./music";
import type { ProgressionBeatEventType } from "./progression";
import {
  planProgressionBeat,
  type ProgressionRhythm,
} from "./progression-playback";

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
) {
  return planProgressionBeat({
    beatInBar,
    beatEventType,
    bpm: 120,
    chordNotes,
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
    expect(events[1]).toMatchObject({ startOffset: 0.25, duration: 0.22 });
  });

  it.each([
    "root-only",
    "chord-tones",
    "degree-ascending",
    "degree-third-first",
    "four-beat",
  ] satisfies ProgressionRhythm[])("%s produces no notes for a rest", (rhythm) => {
    expect(plan(rhythm, 0, undefined, "rest")).toEqual([]);
  });
});
