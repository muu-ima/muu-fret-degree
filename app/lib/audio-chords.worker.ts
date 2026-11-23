import chordino from "@audio/mir-chordino";
import chromagram from "@audio/mir-nnls-chroma";
import type { AudioChordWorkerRequest, AudioChordWorkerResult } from "./audio-chords";

self.onmessage = ({ data }: MessageEvent<AudioChordWorkerRequest>) => {
  const { samples, sampleRate } = data;
  let result: AudioChordWorkerResult;
  try {
    const chroma = chromagram(samples, { fs: sampleRate });
    result = { segments: chordino(chroma, { end: samples.length / sampleRate }) };
  } catch {
    result = { failed: true };
  }
  self.postMessage(result);
};
