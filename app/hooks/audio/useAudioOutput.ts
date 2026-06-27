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
  const masterOutput = useRef<AudioNode | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  }, []);

  const ensureMasterOutput = useCallback(() => {
    const context = ensureAudioContext();
    if (!masterOutput.current) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-22, context.currentTime);
      compressor.knee.setValueAtTime(18, context.currentTime);
      compressor.ratio.setValueAtTime(3, context.currentTime);
      compressor.attack.setValueAtTime(0.003, context.currentTime);
      compressor.release.setValueAtTime(0.18, context.currentTime);
      compressor.connect(context.destination);
      masterOutput.current = compressor;
    }

    return masterOutput.current;
  }, [ensureAudioContext]);

  const playBassNote = useCallback(
    (midi: number, startOffset = 0, duration = 0.85) => {
      playBassAudioNote(ensureAudioContext(), midi, startOffset, duration, ensureMasterOutput());
    },
    [ensureAudioContext, ensureMasterOutput],
  );

  const playMetronomeClick = useCallback(
    (kind: MetronomeClickKind, tone: MetronomeTone, volume: number) => {
      const context = ensureAudioContext();
      playMetronomeAudioClick(context, context.currentTime, kind, tone, volume, ensureMasterOutput());
    },
    [ensureAudioContext, ensureMasterOutput],
  );

  const playPianoNote = useCallback(
    (midi: number, startOffset = 0, duration = 3.2) => {
      playPianoAudioNote(ensureAudioContext(), midi, startOffset, duration, ensureMasterOutput());
    },
    [ensureAudioContext, ensureMasterOutput],
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
