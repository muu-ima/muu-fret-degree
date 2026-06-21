"use client";

import { useCallback } from "react";
import {
  type ChordNote,
  type ChordType,
  type FretNote,
  makeTrebleChordMidi,
  pickAscendingBassNotesForDegrees,
  pickLowestBassNoteForDegree,
} from "../../lib/music";
import { planProgressionBeat, type ProgressionRhythm } from "../../lib/progression/playback";
import type {
  ProgressionBeatEventType,
  ProgressionDurationSteps,
} from "../../lib/progression";

export type ArpeggioPattern = "root-only" | "chord-order" | "third-first" | "lowest-per-degree";

type UseChordPlaybackOptions = {
  root: string;
  chordType: ChordType;
  chordNotes: ChordNote[];
  chordOctaveMidi: number;
  chordInversion: number;
  arpeggioPattern: ArpeggioPattern;
  bpm: number;
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
  arpeggioPattern,
  bpm,
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
    const orderedChordNotes = arpeggioPattern === "root-only" ? chordNotes.slice(0, 1) : chordNotes;
    const playable =
      arpeggioPattern === "lowest-per-degree"
        ? orderedChordNotes.map((chordNote) => pickLowestBassNoteForDegree(notes, chordNote.degree))
        : pickAscendingBassNotesForDegrees(
            notes,
            orderedChordNotes.map((chordNote) => chordNote.degree),
          );
    const playbackOrder =
      arpeggioPattern === "third-first" && playable.length > 1
        ? [playable[1], playable[0], ...playable.slice(2)]
        : playable;

    playbackOrder.forEach((note, index) => {
      if (note) {
        playBassNote(note.midi, index * 0.32, 0.7);
      }
    });
  }, [arpeggioPattern, chordNotes, notes, playBassNote, resumeAudio]);

  const playProgressionBeat = useCallback(
    ({
      beatInBar,
      beatEventType,
      durationSeconds,
      durationSteps,
      followingTieBeats,
      rhythm,
      startDelay,
      nextRoot,
    }: {
      beatInBar: number;
      beatEventType?: ProgressionBeatEventType;
      durationSeconds?: number;
      durationSteps?: ProgressionDurationSteps;
      followingTieBeats?: number;
      rhythm: ProgressionRhythm;
      startDelay?: number;
      nextRoot?: string;
    }) => {
      resumeAudio();
      planProgressionBeat({
        beatInBar,
        beatEventType,
        bpm,
        chordNotes,
        durationSeconds,
        durationSteps,
        followingTieBeats,
        nextRoot,
        notes,
        rhythm,
      }).forEach(
        ({ midi, startOffset, duration }) => {
          playBassNote(midi, startOffset + (startDelay ?? 0), duration);
        },
      );
    },
    [bpm, chordNotes, notes, playBassNote, resumeAudio],
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
