import type { ChordSegment } from "@audio/mir-chordino";
import theory from "../../data/theory.json";

const chordTypeIds: Record<Exclude<ChordSegment["quality"], "N">, string> = {
  maj: "maj",
  min: "min",
  "7": "7",
  maj7: "maj7",
  min7: "m7",
  maj6: "6",
  min6: "m6",
  dim: "dim",
  aug: "aug",
  hdim7: "m7b5",
};

export type AudioChordSelection = { root: string; chordTypeId: string; inversion: number };
export type AudioChordWorkerRequest = { samples: Float32Array; sampleRate: number };
export type AudioChordWorkerResult = { segments: ChordSegment[] } | { failed: true };

export function getAudioChordSelection(segment: ChordSegment): AudioChordSelection | undefined {
  const root = theory.roots[segment.root];
  if (!root || segment.quality === "N") {
    return undefined;
  }

  const chordTypeId = chordTypeIds[segment.quality];
  const chordType = theory.chordTypes.find((type) => type.id === chordTypeId)!;
  const bassInterval = (segment.bass - segment.root + 12) % 12;
  const inversion = chordType.intervals.findIndex((interval) => interval.semitones === bassInterval);
  return { root, chordTypeId, inversion: Math.max(0, inversion) };
}

export async function analyzeAudioFile(file: File, signal: AbortSignal) {
  const sampleRate = 22050;
  const decoder = new OfflineAudioContext(1, 1, sampleRate);
  const decoded = await decoder.decodeAudioData(await file.arrayBuffer());
  signal.throwIfAborted();

  let mono = decoded;
  if (decoded.numberOfChannels > 1) {
    const mixer = new OfflineAudioContext(1, decoded.length, sampleRate);
    const source = mixer.createBufferSource();
    source.buffer = decoded;
    source.connect(mixer.destination);
    source.start();
    mono = await mixer.startRendering();
  }
  signal.throwIfAborted();

  const samples = mono.getChannelData(0).slice();
  const worker = new Worker(new URL("./audio-chords.worker.ts", import.meta.url), { type: "module" });

  return new Promise<ChordSegment[]>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<AudioChordWorkerResult>) => {
      if ("segments" in data) {
        resolve(data.segments);
      } else {
        reject(new Error("Chord estimation failed"));
      }
    };
    worker.onerror = () => reject(new Error("Audio analysis worker failed"));
    worker.onmessageerror = () => reject(new Error("Could not read audio analysis results"));
    const request: AudioChordWorkerRequest = { samples, sampleRate: mono.sampleRate };
    worker.postMessage(request, [samples.buffer]);
  }).finally(() => worker.terminate());
}
