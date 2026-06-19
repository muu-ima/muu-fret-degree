"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MetronomeClickKind, MetronomeTone } from "../lib/audio";

type UseMetronomeOptions = {
  bpm: number;
  beatsPerMeasure: number;
  pulsesPerBeat: number;
  countInMeasures: number;
  swingRatio: number;
  metronomeTone: MetronomeTone;
  accentFirstBeat: boolean;
  metronomeVolume: number;
  playClick: (kind: MetronomeClickKind, tone: MetronomeTone, volume: number) => void;
  resumeAudio: () => void;
};

export function useMetronome({
  bpm,
  beatsPerMeasure,
  pulsesPerBeat,
  countInMeasures,
  swingRatio,
  metronomeTone,
  accentFirstBeat,
  metronomeVolume,
  playClick,
  resumeAudio,
}: UseMetronomeOptions) {
  const metronomeTimer = useRef<number | null>(null);
  const metronomePulse = useRef(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentPulse, setCurrentPulse] = useState(1);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeatsRemaining, setCountInBeatsRemaining] = useState(0);

  const stopMetronome = useCallback(() => {
    if (metronomeTimer.current !== null) {
      window.clearTimeout(metronomeTimer.current);
      metronomeTimer.current = null;
    }
  }, []);

  const toggleMetronome = useCallback(() => {
    setIsMetronomeRunning((running) => !running);
  }, []);

  useEffect(() => {
    stopMetronome();

    if (!isMetronomeRunning) {
      setIsCountingIn(false);
      setCountInBeatsRemaining(0);
      return;
    }

    const beatMs = (60 / bpm) * 1000;
    const pulseMs = beatMs / pulsesPerBeat;
    const countInBeats = countInMeasures * beatsPerMeasure;
    const countInPulses = countInBeats * pulsesPerBeat;
    metronomePulse.current = 0;

    const tick = () => {
      const absolutePulse = metronomePulse.current;
      const isCountInPulse = absolutePulse < countInPulses;
      const playbackPulse = isCountInPulse ? absolutePulse : absolutePulse - countInPulses;
      const pulseInMeasure = playbackPulse % (beatsPerMeasure * pulsesPerBeat);
      const beat = Math.floor(pulseInMeasure / pulsesPerBeat);
      const pulse = pulseInMeasure % pulsesPerBeat;
      const clickKind: MetronomeClickKind =
        pulse === 0
          ? accentFirstBeat && beat === 0
            ? "accent"
            : "beat"
          : "subdivision";
      resumeAudio();
      playClick(clickKind, metronomeTone, metronomeVolume);
      setCurrentBeat(beat + 1);
      setCurrentPulse(pulse + 1);
      setIsCountingIn(isCountInPulse);
      if (pulse === 0) {
        const elapsedCountInBeats = Math.floor(absolutePulse / pulsesPerBeat);
        setCountInBeatsRemaining(isCountInPulse ? countInBeats - elapsedCountInBeats : 0);
      }
      metronomePulse.current += 1;

      const nextPulseMs =
        pulsesPerBeat === 2 && swingRatio > 0
          ? pulse === 0
            ? beatMs * swingRatio
            : beatMs * (1 - swingRatio)
          : pulseMs;
      metronomeTimer.current = window.setTimeout(tick, nextPulseMs);
    };

    tick();

    return stopMetronome;
  }, [
    accentFirstBeat,
    beatsPerMeasure,
    bpm,
    countInMeasures,
    isMetronomeRunning,
    metronomeTone,
    metronomeVolume,
    playClick,
    pulsesPerBeat,
    resumeAudio,
    stopMetronome,
    swingRatio,
  ]);

  return {
    currentBeat,
    currentPulse,
    countInBeatsRemaining,
    isCountingIn,
    isMetronomeRunning,
    toggleMetronome,
  };
}
