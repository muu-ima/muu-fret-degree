"use client";

import { useCallback } from "react";
import {
  type ChordNote,
  type ChordType,
  type FretNote,
  makeTrebleChordMidi,
} from "../lib/music";

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
    const playable = chordNotes.map((chordNote) => {
      const candidates = notes.filter((note) => note.degree === chordNote.degree && note.fret <= 7);
      return candidates.sort((a, b) => a.midi - b.midi)[0];
    });

    playable.forEach((note, index) => {
      if (note) {
        playBassNote(note.midi, index * 0.32, 0.7);
      }
    });
  }, [chordNotes, notes, playBassNote, resumeAudio]);

  const playProgressionBeat = useCallback(
    (beatInCell: number) => {
      resumeAudio();
      const chordNote = chordNotes[beatInCell % chordNotes.length];
      const candidates = notes.filter((note) => note.degree === chordNote.degree && note.fret <= 7);
      const note = candidates.sort((a, b) => a.midi - b.midi)[0];

      if (note) {
        playBassNote(note.midi, 0, beatInCell === 0 ? 0.85 : 0.6);
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
