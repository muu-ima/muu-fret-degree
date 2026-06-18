import { frequencyFromMidi } from "./music";

export type MetronomeClickKind = "accent" | "beat" | "subdivision";

export function playMetronomeClick(
  context: AudioContext,
  startTime: number,
  kind: MetronomeClickKind,
  volume = 1,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const isSubdivision = kind === "subdivision";
  const end = startTime + (isSubdivision ? 0.035 : 0.055);
  const frequency = kind === "accent" ? 1320 : kind === "beat" ? 920 : 680;
  const baseGain = kind === "accent" ? 0.42 : kind === "beat" ? 0.28 : 0.14;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  const peakGain = baseGain * Math.min(1, Math.max(0, volume));
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(end + 0.01);
}

export function playBassNote(
  context: AudioContext,
  midi: number,
  startOffset = 0,
  duration = 0.85,
) {
  const start = context.currentTime + startOffset;
  const end = start + duration;
  const frequency = frequencyFromMidi(midi);
  const oscillator = context.createOscillator();
  const subOscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const drive = context.createWaveShaper();

  const curve = new Float32Array(256);
  for (let i = 0; i < curve.length; i += 1) {
    const x = i / 128 - 1;
    curve[i] = Math.tanh(x * 2.4);
  }

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(frequency, start);
  subOscillator.type = "sine";
  subOscillator.frequency.setValueAtTime(frequency / 2, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(880, start);
  filter.frequency.exponentialRampToValueAtTime(180, end);
  filter.Q.setValueAtTime(3.5, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.38, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.18, start + 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(drive);
  subOscillator.connect(drive);
  drive.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

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
) {
  const start = context.currentTime + startOffset;
  const end = start + duration;
  const frequency = frequencyFromMidi(midi);
  const output = context.createGain();
  const filter = context.createBiquadFilter();
  const partials = [
    { ratio: 1, gain: 0.34, type: "triangle" as OscillatorType },
    { ratio: 2, gain: 0.12, type: "sine" as OscillatorType },
    { ratio: 3, gain: 0.045, type: "sine" as OscillatorType },
  ];

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(5200, start);
  filter.frequency.exponentialRampToValueAtTime(1500, end);
  output.gain.setValueAtTime(0.0001, start);
  output.gain.exponentialRampToValueAtTime(0.34, start + 0.012);
  output.gain.exponentialRampToValueAtTime(0.16, start + 0.12);
  output.gain.exponentialRampToValueAtTime(0.0001, end);

  partials.forEach((partial) => {
    const oscillator = context.createOscillator();
    const partialGain = context.createGain();
    oscillator.type = partial.type;
    oscillator.frequency.setValueAtTime(frequency * partial.ratio, start);
    partialGain.gain.setValueAtTime(partial.gain, start);
    oscillator.connect(partialGain);
    partialGain.connect(filter);
    oscillator.start(start);
    oscillator.stop(end + 0.05);
  });

  filter.connect(output);
  output.connect(context.destination);
}
