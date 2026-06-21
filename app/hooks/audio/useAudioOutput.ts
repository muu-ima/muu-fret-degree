"use client";

import { useCallback, useRef } from "react";
import {
  type MetronomeClickKind,
  type MetronomeTone,
  playBassNote as playBassAudioNote,
  playMetronomeClick as playMetronomeAudioClick,
  playPianoNote as playPianoAudioNote,
} from "../../lib/audio";

export function useAudioOutput() {
  const audioContext = useRef<AudioContext | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  }, []);

  const playBassNote = useCallback(
    (midi: number, startOffset = 0, duration = 0.85) => {
      playBassAudioNote(ensureAudioContext(), midi, startOffset, duration);
    },
    [ensureAudioContext],
  );

  const playMetronomeClick = useCallback(
    (kind: MetronomeClickKind, tone: MetronomeTone, volume: number) => {
      const context = ensureAudioContext();
      playMetronomeAudioClick(context, context.currentTime, kind, tone, volume);
    },
    [ensureAudioContext],
  );

  const playPianoNote = useCallback(
    (midi: number, startOffset = 0, duration = 1.8) => {
      playPianoAudioNote(ensureAudioContext(), midi, startOffset, duration);
    },
    [ensureAudioContext],
  );

  const resumeAudio = useCallback(() => {
    void ensureAudioContext().resume();
  }, [ensureAudioContext]);

  return {
    playBassNote,
    playMetronomeClick,
    playPianoNote,
    resumeAudio,
  };
}
