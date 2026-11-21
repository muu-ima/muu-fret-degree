"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMetronomeMixClicks, mixerStepsPerBeat, type MetronomeMix } from "../../lib/metronome-mixer";
import type { MetronomeClickKind, MetronomeTone } from "../../lib/audio";

type UseMetronomeOptions = {
  mix: MetronomeMix;
  bpm: number;
  beatsPerMeasure: number;
  countInMeasures: number;
  metronomeTone: MetronomeTone;
  metronomeVolume: number;
  playClick: (kind: MetronomeClickKind, tone: MetronomeTone, volume: number) => void;
  resumeAudio: () => void;
  onCountInComplete?: () => void;
};

export function useMetronome({
  mix,
  bpm,
  beatsPerMeasure,
  countInMeasures,
  metronomeTone,
  metronomeVolume,
  playClick,
  resumeAudio,
  onCountInComplete,
}: UseMetronomeOptions) {
  const metronomeTimer = useRef<number | null>(null);
  const metronomePulse = useRef(0);
  const onCountInCompleteRef = useRef(onCountInComplete);
  const soundRef = useRef({ mix, metronomeTone, metronomeVolume });
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [runCycle, setRunCycle] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeatsRemaining, setCountInBeatsRemaining] = useState(0);

  onCountInCompleteRef.current = onCountInComplete;

  // Sound changes preserve the current beat and count-in.
  useEffect(() => {
    soundRef.current = { mix, metronomeTone, metronomeVolume };
  }, [mix, metronomeTone, metronomeVolume]);

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
    const stepsPerBeat = mixerStepsPerBeat;
    const pulseMs = beatMs / stepsPerBeat;
    const countInBeats = countInMeasures * beatsPerMeasure;
    const countInPulses = countInBeats * stepsPerBeat;
    metronomePulse.current = 0;

    const tick = () => {
      const absolutePulse = metronomePulse.current;
      const isCountInPulse = absolutePulse < countInPulses;
      const playbackPulse = isCountInPulse ? absolutePulse : absolutePulse - countInPulses;
      const pulseInMeasure = playbackPulse % (beatsPerMeasure * stepsPerBeat);
      const beat = Math.floor(pulseInMeasure / stepsPerBeat);
      const pulse = pulseInMeasure % stepsPerBeat;
      const sound = soundRef.current;
      resumeAudio();
      // Count-in remains audible even when all mixer channels are muted.
      const clicks = isCountInPulse
        ? pulse === 0 ? [{ kind: "beat" as const, volume: 1 }] : []
        : getMetronomeMixClicks(beat, pulse, sound.mix);
      for (const click of clicks) {
        if (sound.metronomeVolume > 0) playClick(click.kind, sound.metronomeTone, click.volume * sound.metronomeVolume);
      }
      if (countInPulses > 0 && absolutePulse === countInPulses) {
        onCountInCompleteRef.current?.();
      }
      setCurrentBeat(beat + 1);
      setIsCountingIn(isCountInPulse);
      if (pulse === 0) {
        const elapsedCountInBeats = Math.floor(absolutePulse / stepsPerBeat);
        setCountInBeatsRemaining(isCountInPulse ? countInBeats - elapsedCountInBeats : 0);
      }
      metronomePulse.current += 1;

      metronomeTimer.current = window.setTimeout(tick, pulseMs);
    };

    tick();

    return clearMetronomeTimer;
  }, [
    beatsPerMeasure,
    bpm,
    clearMetronomeTimer,
    countInMeasures,
    isMetronomeRunning,
    playClick,
    resumeAudio,
    runCycle,
  ]);

  return {
    currentBeat,
    countInBeatsRemaining,
    isCountingIn,
    isMetronomeRunning,
    startMetronome,
    stopMetronome,
    toggleMetronome,
  };
}
