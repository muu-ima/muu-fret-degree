"use client";

import { useCallback } from "react";
import {
  type ChordNote,
  type ChordType,
  type FretNote,
  makeTrebleChordMidi,
  pickLowestBassNoteForDegree,
  pitchClassOf,
  sharpPitchClasses,
} from "../lib/music";

export type ProgressionRhythm = "chord-tones" | "four-beat";

type UseChordPlaybackOptions = {
  root: string;
  chordType: ChordType;
  chordNotes: ChordNote[];
  chordOctaveMidi: number;
  chordInversion: number;
  notes: FretNote[];
  playBassNote: (midi: number, startOffset?: number, duration?: number) => void;
  playPianoNote: (midi: number, startOffset?: number, duration?: number) => void;
  resumeAudio: () => void;
};

export function useChordPlayback({
  root,
  chordType,
  chordNotes,
  chordOctaveMidi,
  chordInversion,
  notes,
  playBassNote,
  playPianoNote,
  resumeAudio,
}: UseChordPlaybackOptions) {
  const playNote = useCallback(
    (note: FretNote) => {
      resumeAudio();
      playBassNote(note.midi);
    },
    [playBassNote, resumeAudio],
  );

  const playArpeggio = useCallback(() => {
    resumeAudio();
    const playable = chordNotes.map((chordNote) => pickLowestBassNoteForDegree(notes, chordNote.degree));

    playable.forEach((note, index) => {
      if (note) {
        playBassNote(note.midi, index * 0.32, 0.7);
      }
    });
  }, [chordNotes, notes, playBassNote, resumeAudio]);

  const playProgressionBeat = useCallback(
    ({
      beatInBar,
      rhythm,
      nextRoot,
    }: {
      beatInBar: number;
      rhythm: ProgressionRhythm;
      nextRoot?: string;
    }) => {
      resumeAudio();
      const beatInCell = beatInBar % 2;
      let note: FretNote | undefined;

      if (rhythm === "four-beat" && beatInBar === 3 && nextRoot) {
        const nextRootIndex = sharpPitchClasses.indexOf(pitchClassOf(nextRoot));
        const approachPitchClass = sharpPitchClasses[(nextRootIndex + sharpPitchClasses.length - 1) % sharpPitchClasses.length];
        note = notes
          .filter((candidate) => candidate.pitchClass === approachPitchClass)
          .sort((first, second) => first.midi - second.midi)[0];
      } else if (rhythm === "four-beat") {
        const degree = beatInCell === 0 ? "1" : chordNotes.find((chordNote) => chordNote.degree === "5")?.degree;
        note = pickLowestBassNoteForDegree(notes, degree ?? chordNotes[1]?.degree ?? "1");
      } else {
        const chordNote = chordNotes[beatInCell % chordNotes.length];
        note = pickLowestBassNoteForDegree(notes, chordNote.degree);
      }

      if (note) {
        const duration = rhythm === "four-beat" ? (beatInBar === 3 ? 0.5 : 0.72) : beatInCell === 0 ? 0.85 : 0.6;
        playBassNote(note.midi, 0, duration);
      }
    },
    [chordNotes, notes, playBassNote, resumeAudio],
  );

  const playStack = useCallback(() => {
    resumeAudio();
    makeTrebleChordMidi(root, chordType, chordOctaveMidi, chordInversion).forEach((midi, index) => {
      playPianoNote(midi, index * 0.012, 1.9);
    });
  }, [chordInversion, chordOctaveMidi, chordType, playPianoNote, resumeAudio, root]);

  return {
    playArpeggio,
    playNote,
    playProgressionBeat,
    playStack,
  };
}
