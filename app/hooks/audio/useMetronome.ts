"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMetronomeClickKind } from "../../lib/metronome-click";
import type { MetronomeClickKind, MetronomeTone } from "../../lib/audio";

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
  onCountInComplete?: () => void;
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
  onCountInComplete,
}: UseMetronomeOptions) {
  const metronomeTimer = useRef<number | null>(null);
  const metronomePulse = useRef(0);
  const onCountInCompleteRef = useRef(onCountInComplete);
  const accentEnabledRef = useRef(accentFirstBeat);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [runCycle, setRunCycle] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentPulse, setCurrentPulse] = useState(1);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeatsRemaining, setCountInBeatsRemaining] = useState(0);

  onCountInCompleteRef.current = onCountInComplete;

  // Updating the sound must not restart the timer or reset the count-in.
  useEffect(() => {
    accentEnabledRef.current = accentFirstBeat;
  }, [accentFirstBeat]);

  const clearMetronomeTimer = useCallback(() => {
    if (metronomeTimer.current !== null) {
      window.clearTimeout(metronomeTimer.current);
      metronomeTimer.current = null;
    }
  }, []);

  const startMetronome = useCallback(() => {
    setRunCycle((current) => current + 1);
    setIsMetronomeRunning(true);
  }, []);

  const stopMetronome = useCallback(() => {
    clearMetronomeTimer();
    setIsMetronomeRunning(false);
  }, [clearMetronomeTimer]);

  const toggleMetronome = useCallback(() => {
    if (isMetronomeRunning) {
      stopMetronome();
      return;
    }

    startMetronome();
  }, [isMetronomeRunning, startMetronome, stopMetronome]);

  useEffect(() => {
    clearMetronomeTimer();

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
      const clickKind = getMetronomeClickKind(accentEnabledRef.current, beat, pulse);
      resumeAudio();
      playClick(clickKind, metronomeTone, metronomeVolume);
      if (countInPulses > 0 && absolutePulse === countInPulses) {
        onCountInCompleteRef.current?.();
      }
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

    return clearMetronomeTimer;
  }, [
    beatsPerMeasure,
    bpm,
    clearMetronomeTimer,
    countInMeasures,
    isMetronomeRunning,
    metronomeTone,
    metronomeVolume,
    playClick,
    pulsesPerBeat,
    resumeAudio,
    runCycle,
    swingRatio,
  ]);

  return {
    currentBeat,
    currentPulse,
    countInBeatsRemaining,
    isCountingIn,
    isMetronomeRunning,
    startMetronome,
    stopMetronome,
    toggleMetronome,
  };
}
