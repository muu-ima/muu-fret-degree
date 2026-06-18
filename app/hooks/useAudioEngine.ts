"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MetronomeTone,
  playBassNote as playBassAudioNote,
  playMetronomeClick as playMetronomeAudioClick,
  playPianoNote as playPianoAudioNote,
} from "../lib/audio";

type UseAudioEngineOptions = {
  bpm: number;
  beatsPerMeasure: number;
  pulsesPerBeat: number;
  metronomeTone: MetronomeTone;
  accentFirstBeat: boolean;
  metronomeVolume: number;
};

export function useAudioEngine({
  bpm,
  beatsPerMeasure,
  pulsesPerBeat,
  metronomeTone,
  accentFirstBeat,
  metronomeVolume,
}: UseAudioEngineOptions) {
  const audioContext = useRef<AudioContext | null>(null);
  const metronomeTimer = useRef<number | null>(null);
  const metronomePulse = useRef(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentPulse, setCurrentPulse] = useState(1);

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

    const pulseMs = ((60 / bpm) * 1000) / pulsesPerBeat;
    metronomePulse.current = 0;

    const tick = () => {
      const context = ensureAudioContext();
      const pulseInMeasure = metronomePulse.current % (beatsPerMeasure * pulsesPerBeat);
      const beat = Math.floor(pulseInMeasure / pulsesPerBeat);
      const pulse = pulseInMeasure % pulsesPerBeat;
      const clickKind =
        pulse === 0
          ? accentFirstBeat && beat === 0
            ? "accent"
            : "beat"
          : "subdivision";
      void context.resume();
      playMetronomeAudioClick(context, context.currentTime, clickKind, metronomeTone, metronomeVolume);
      setCurrentBeat(beat + 1);
      setCurrentPulse(pulse + 1);
      metronomePulse.current += 1;
    };

    tick();
    metronomeTimer.current = window.setInterval(tick, pulseMs);

    return stopMetronome;
  }, [
    accentFirstBeat,
    beatsPerMeasure,
    bpm,
    ensureAudioContext,
    isMetronomeRunning,
    metronomeVolume,
    metronomeTone,
    pulsesPerBeat,
    stopMetronome,
  ]);

  return {
    currentBeat,
    currentPulse,
    isMetronomeRunning,
    playBassNote,
    playPianoNote,
    resumeAudio,
    toggleMetronome,
  };
}
