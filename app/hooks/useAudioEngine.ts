"use client";

import type { MetronomeTone } from "../lib/audio";
import { useAudioOutput } from "./useAudioOutput";
import { useMetronome } from "./useMetronome";

type UseAudioEngineOptions = {
  bpm: number;
  beatsPerMeasure: number;
  pulsesPerBeat: number;
  countInMeasures: number;
  swingRatio: number;
  metronomeTone: MetronomeTone;
  accentFirstBeat: boolean;
  metronomeVolume: number;
};

export function useAudioEngine(options: UseAudioEngineOptions) {
  const audioOutput = useAudioOutput();
  const metronome = useMetronome({
    ...options,
    playClick: audioOutput.playMetronomeClick,
    resumeAudio: audioOutput.resumeAudio,
  });

  return {
    ...metronome,
    playBassNote: audioOutput.playBassNote,
    playPianoNote: audioOutput.playPianoNote,
    resumeAudio: audioOutput.resumeAudio,
  };
}
