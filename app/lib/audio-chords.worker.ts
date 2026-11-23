import detect from "@audio/beat-detect";
import chordino from "@audio/mir-chordino";
import downbeat from "@audio/mir-downbeat";
import chromagram from "@audio/mir-nnls-chroma";
import type { AudioChordAnalysis, AudioChordWorkerRequest, AudioChordWorkerResult } from "./audio-chords";

function estimateTiming(samples: Float32Array, sampleRate: number): AudioChordAnalysis["timing"] {
  try {
    const { bpm, beats, onsets, confidence } = detect(samples, { fs: sampleRate, hopSize: 256 });
    if (onsets.length < 4 || beats.length < 4 || !confidence || !Number.isFinite(bpm)) return null;

    const { downbeats } = downbeat(samples, { beats: Array.from(beats), fs: sampleRate, meter: 4 });
    const firstBarStart = downbeats[0] ?? beats[0];
    // Treat the analysis hop's uncertainty around the file start as zero.
    return { bpm, firstBarStart: firstBarStart < 256 / sampleRate ? 0 : firstBarStart };
  } catch {
    return null;
  }
}

self.onmessage = ({ data }: MessageEvent<AudioChordWorkerRequest>) => {
  const { samples, sampleRate } = data;
  let result: AudioChordWorkerResult;
  try {
    const chroma = chromagram(samples, { fs: sampleRate });
    const duration = samples.length / sampleRate;
    result = {
      segments: chordino(chroma, { end: duration }),
      duration,
      timing: estimateTiming(samples, sampleRate),
    };
  } catch {
    result = { failed: true };
  }
  self.postMessage(result);
};
