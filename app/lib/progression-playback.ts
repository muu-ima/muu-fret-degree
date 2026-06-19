import {
  type ChordNote,
  type FretNote,
  pickAscendingBassNotesForDegrees,
  pickLowestBassNoteForDegree,
  pitchClassOf,
  sharpPitchClasses,
} from "./music";
import type { ProgressionBeatEventType } from "./progression";

export type ProgressionRhythm =
  | "root-only"
  | "chord-tones"
  | "degree-ascending"
  | "degree-third-first"
  | "four-beat";

export type ScheduledBassNote = {
  midi: number;
  startOffset: number;
  duration: number;
};

type PlanProgressionBeatOptions = {
  beatInBar: number;
  beatEventType?: ProgressionBeatEventType;
  bpm: number;
  chordNotes: ChordNote[];
  nextRoot?: string;
  notes: FretNote[];
  rhythm: ProgressionRhythm;
};

function scheduleNote(note: FretNote | undefined, duration: number): ScheduledBassNote[] {
  return note ? [{ midi: note.midi, startOffset: 0, duration }] : [];
}

export function planProgressionBeat({
  beatInBar,
  beatEventType = "hit",
  bpm,
  chordNotes,
  nextRoot,
  notes,
  rhythm,
}: PlanProgressionBeatOptions): ScheduledBassNote[] {
  if (beatEventType === "rest") {
    return [];
  }

  const beatInCell = beatInBar % 2;

  if (rhythm === "root-only") {
    return scheduleNote(pickLowestBassNoteForDegree(notes, "1"), beatInCell === 0 ? 0.85 : 0.6);
  }

  if (rhythm === "degree-ascending" || rhythm === "degree-third-first") {
    const ascendingNotes = pickAscendingBassNotesForDegrees(
      notes,
      chordNotes.map((chordNote) => chordNote.degree),
    );
    const degreeFlow =
      rhythm === "degree-third-first" && ascendingNotes.length > 1
        ? [ascendingNotes[1], ascendingNotes[0], ...ascendingNotes.slice(2)]
        : ascendingNotes;
    const notesThisBeat = degreeFlow.slice(beatInCell * 2, beatInCell * 2 + 2);
    const beatDuration = 60 / Math.max(1, bpm);

    return notesThisBeat.map((note, index) => ({
      midi: note.midi,
      startOffset: index * (beatDuration / 2),
      duration: beatDuration * 0.44,
    }));
  }

  if (rhythm === "four-beat" && beatInBar === 3 && nextRoot) {
    const nextRootIndex = sharpPitchClasses.indexOf(pitchClassOf(nextRoot));
    if (nextRootIndex < 0) {
      return [];
    }

    const approachPitchClass =
      sharpPitchClasses[(nextRootIndex + sharpPitchClasses.length - 1) % sharpPitchClasses.length];
    const approachNote = notes
      .filter((candidate) => candidate.pitchClass === approachPitchClass)
      .sort((first, second) => first.midi - second.midi)[0];
    return scheduleNote(approachNote, 0.5);
  }

  if (rhythm === "four-beat") {
    const degree =
      beatInCell === 0
        ? "1"
        : chordNotes.find((chordNote) => chordNote.degree === "5")?.degree;
    return scheduleNote(
      pickLowestBassNoteForDegree(notes, degree ?? chordNotes[1]?.degree ?? "1"),
      0.72,
    );
  }

  const chordNote = chordNotes[beatInCell % chordNotes.length];
  return scheduleNote(
    chordNote ? pickLowestBassNoteForDegree(notes, chordNote.degree) : undefined,
    beatInCell === 0 ? 0.85 : 0.6,
  );
}
