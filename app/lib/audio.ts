import { frequencyFromMidi } from "./music";

export type MetronomeClickKind = "accent" | "beat" | "subdivision";
export type MetronomeTone = "classic" | "soft" | "wood";
type AudioOutputNode = AudioNode;

function connectToOutput(source: AudioNode, output: AudioOutputNode) {
  source.connect(output);
}

const metronomeToneProfiles: Record<
  MetronomeTone,
  {
    oscillator: OscillatorType;
    beatFrequency: number;
    subdivisionFrequency: number;
    beatGain: number;
    subdivisionGain: number;
    beatDuration: number;
    subdivisionDuration: number;
  }
> = {
  classic: {
    oscillator: "square",
    beatFrequency: 920,
    subdivisionFrequency: 680,
    beatGain: 0.28,
    subdivisionGain: 0.14,
    beatDuration: 0.055,
    subdivisionDuration: 0.035,
  },
  soft: {
    oscillator: "sine",
    beatFrequency: 740,
    subdivisionFrequency: 540,
    beatGain: 0.24,
    subdivisionGain: 0.1,
    beatDuration: 0.09,
    subdivisionDuration: 0.055,
  },
  wood: {
    oscillator: "triangle",
    beatFrequency: 1120,
    subdivisionFrequency: 820,
    beatGain: 0.3,
    subdivisionGain: 0.12,
    beatDuration: 0.045,
    subdivisionDuration: 0.03,
  },
};

export function playMetronomeClick(
  context: AudioContext,
  startTime: number,
  kind: MetronomeClickKind,
  tone: MetronomeTone,
  volume = 1,
  output: AudioOutputNode = context.destination,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const profile = metronomeToneProfiles[tone];
  const isSubdivision = kind === "subdivision";
  const isAccent = kind === "accent";
  const end = startTime + (isSubdivision ? profile.subdivisionDuration : profile.beatDuration);
  const frequency = isSubdivision
    ? profile.subdivisionFrequency
    : profile.beatFrequency * (isAccent ? 1.35 : 1);
  const baseGain = isSubdivision
    ? profile.subdivisionGain
    : profile.beatGain * (isAccent ? 1.35 : 1);

  oscillator.type = profile.oscillator;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  const peakGain = baseGain * Math.min(1, Math.max(0, volume));
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  connectToOutput(gain, output);
  oscillator.start(startTime);
  oscillator.stop(end + 0.01);
}

export function playBassNote(
  context: AudioContext,
  midi: number,
  startOffset = 0,
  duration = 0.85,
  output: AudioOutputNode = context.destination,
) {
  const start = context.currentTime + startOffset;
  const end = start + duration;
  const frequency = frequencyFromMidi(midi);
  const oscillator = context.createOscillator();
  const subOscillator = context.createOscillator();
  const mainGain = context.createGain();
  const subGain = context.createGain();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  subOscillator.type = "sine";
  subOscillator.frequency.setValueAtTime(frequency / 2, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(520, start);
  filter.frequency.exponentialRampToValueAtTime(170, end);
  filter.Q.setValueAtTime(0.35, start);
  mainGain.gain.setValueAtTime(0.7, start);
  subGain.gain.setValueAtTime(0.5, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.24, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.13, start + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(mainGain);
  subOscillator.connect(subGain);
  mainGain.connect(filter);
  subGain.connect(filter);
  filter.connect(gain);
  connectToOutput(gain, output);

  oscillator.start(start);
  subOscillator.start(start);
  oscillator.stop(end + 0.05);
  subOscillator.stop(end + 0.05);
}

export function playPianoNote(
  context: AudioContext,
  midi: number,
  startOffset = 0,
  duration = 1.8,
  destination: AudioOutputNode = context.destination,
) {
  const start = context.currentTime + startOffset;
  const end = start + duration;
  const frequency = frequencyFromMidi(midi);
  const mainGain = context.createGain();
  const filter = context.createBiquadFilter();
  const partials = [
    { ratio: 1, gain: 0.26, type: "triangle" as OscillatorType, detune: -2 },
    { ratio: 2, gain: 0.085, type: "sine" as OscillatorType, detune: 2 },
    { ratio: 3, gain: 0.03, type: "sine" as OscillatorType, detune: -1 },
  ];

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(4200, start);
  filter.frequency.exponentialRampToValueAtTime(1700, end);
  filter.Q.setValueAtTime(0.6, start);
  mainGain.gain.setValueAtTime(0.0001, start);
  mainGain.gain.exponentialRampToValueAtTime(0.3, start + 0.024);
  mainGain.gain.exponentialRampToValueAtTime(0.15, start + 0.18);
  mainGain.gain.exponentialRampToValueAtTime(0.0001, end);

  partials.forEach((partial) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    oscillator.type = partial.type;
    oscillator.frequency.setValueAtTime(frequency * partial.ratio, start);
    oscillator.detune.setValueAtTime(partial.detune, start);
    partialGain.gain.setValueAtTime(partial.gain, start);
    oscillator.connect(partialGain);
    partialGain.connect(filter);
    oscillator.start(start);
    oscillator.stop(end + 0.05);
  });

  filter.connect(mainGain);
  connectToOutput(mainGain, destination);
}
