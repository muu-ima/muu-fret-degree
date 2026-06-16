"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  playBassNote as playBassAudioNote,
  playMetronomeClick as playMetronomeAudioClick,
  playPianoNote as playPianoAudioNote,
} from "../lib/audio";

type UseAudioEngineOptions = {
  bpm: number;
};

export function useAudioEngine({ bpm }: UseAudioEngineOptions) {
  const audioContext = useRef<AudioContext | null>(null);
  const metronomeTimer = useRef<number | null>(null);
  const metronomeBeat = useRef(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);

  const ensureAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  }, []);

  const stopMetronome = useCallback(() => {
    if (metronomeTimer.current !== null) {
      window.clearInterval(metronomeTimer.current);
      metronomeTimer.current = null;
    }
  }, []);

  const playBassNote = useCallback(
    (midi: number, startOffset = 0, duration = 0.85) => {
      playBassAudioNote(ensureAudioContext(), midi, startOffset, duration);
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

  const toggleMetronome = useCallback(() => {
    setIsMetronomeRunning((running) => !running);
  }, []);

  useEffect(() => {
    stopMetronome();

    if (!isMetronomeRunning) {
      return;
    }

    const beatMs = (60 / bpm) * 1000;
    metronomeBeat.current = 0;

    const tick = () => {
      const context = ensureAudioContext();
      const beat = metronomeBeat.current % 4;
      void context.resume();
      playMetronomeAudioClick(context, context.currentTime, beat === 0);
      setCurrentBeat(beat + 1);
      metronomeBeat.current += 1;
    };

    tick();
    metronomeTimer.current = window.setInterval(tick, beatMs);

    return stopMetronome;
  }, [bpm, ensureAudioContext, isMetronomeRunning, stopMetronome]);

  return {
    currentBeat,
    isMetronomeRunning,
    playBassNote,
    playPianoNote,
    resumeAudio,
    toggleMetronome,
  };
}
