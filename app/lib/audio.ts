import { frequencyFromMidi } from "./music";

export type MetronomeClickKind = "accent" | "beat" | "subdivision";
export type MetronomeTone = "classic" | "soft" | "wood";
type AudioOutputNode = AudioNode;

type BassSample = {
  buffer: AudioBuffer;
  baseFrequency: number;
};

type PianoSample = {
  buffer: AudioBuffer;
  baseFrequency: number;
};

const bassSampleCache = new WeakMap<AudioContext, BassSample>();
const pianoSampleCache = new WeakMap<AudioContext, PianoSample>();
const bassSampleDuration = 1.15;
const bassSampleBaseFrequency = 82.4068892282175;
const bassSampleAttack = 0.02;
const bassSampleDecay = 0.16;
const bassSampleRelease = 0.28;
const pianoSampleDuration = 2.45;
const pianoSampleBaseFrequency = 110;
const pianoSampleAttack = 0.012;
const pianoSampleDecay = 0.26;
const pianoSampleRelease = 0.7;

function connectToOutput(source: AudioNode, output: AudioOutputNode) {
  source.connect(output);
}

function createBassSample(context: AudioContext): BassSample {
  const sampleRate = context.sampleRate;
  const length = Math.ceil(sampleRate * bassSampleDuration);
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    const attackLevel = Math.min(1, time / bassSampleAttack);
    const decayLevel = time < bassSampleAttack
      ? attackLevel
      : Math.exp(-(time - bassSampleAttack) / bassSampleDecay);
    const releaseStart = bassSampleDuration - bassSampleRelease;
    const releaseLevel = time > releaseStart
      ? Math.exp(-(time - releaseStart) / bassSampleRelease)
      : 1;
    const envelope = decayLevel * releaseLevel;
    const body =
      Math.sin(2 * Math.PI * bassSampleBaseFrequency * time) * 0.78 +
      Math.sin(2 * Math.PI * bassSampleBaseFrequency * 2 * time) * 0.06 +
      Math.sin(2 * Math.PI * bassSampleBaseFrequency * 3 * time) * 0.02;
    channel[i] = body * envelope * 0.9;
  }

  return { buffer, baseFrequency: bassSampleBaseFrequency };
}

function ensureBassSample(context: AudioContext) {
  const cached = bassSampleCache.get(context);
  if (cached) {
    return cached;
  }

  const sample = createBassSample(context);
  bassSampleCache.set(context, sample);
  return sample;
}

function createPianoSample(context: AudioContext): PianoSample {
  const sampleRate = context.sampleRate;
  const length = Math.ceil(sampleRate * pianoSampleDuration);
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    const attackLevel = Math.min(1, time / pianoSampleAttack);
    const decayLevel = time < pianoSampleAttack
      ? attackLevel
      : Math.exp(-(time - pianoSampleAttack) / pianoSampleDecay);
    const releaseStart = pianoSampleDuration - pianoSampleRelease;
    const releaseLevel = time > releaseStart
      ? Math.exp(-(time - releaseStart) / pianoSampleRelease)
      : 1;
    const envelope = decayLevel * releaseLevel;
    const strike = Math.exp(-time / 0.018);
    const body =
      Math.sin(2 * Math.PI * pianoSampleBaseFrequency * time) * 0.52 +
      Math.sin(2 * Math.PI * pianoSampleBaseFrequency * 2 * time) * 0.28 +
      Math.sin(2 * Math.PI * pianoSampleBaseFrequency * 3 * time) * 0.12 +
      Math.sin(2 * Math.PI * pianoSampleBaseFrequency * 4 * time) * 0.05 +
      Math.sin(2 * Math.PI * pianoSampleBaseFrequency * 5 * time) * 0.02;
    const brightness = 1 - Math.min(1, time / 0.22) * 0.38;
    channel[i] = body * envelope * brightness + strike * envelope * 0.018;
  }

  return { buffer, baseFrequency: pianoSampleBaseFrequency };
}

function ensurePianoSample(context: AudioContext) {
  const cached = pianoSampleCache.get(context);
  if (cached) {
    return cached;
  }

  const sample = createPianoSample(context);
  pianoSampleCache.set(context, sample);
  return sample;
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
  const sample = ensureBassSample(context);
  const source = context.createBufferSource();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const attack = Math.min(0.03, Math.max(0.01, duration * 0.3));
  const release = Math.min(0.14, Math.max(0.06, duration * 0.45));
  const sustainLevel = duration < 0.2 ? 0.09 : 0.14;
  const releaseStart = Math.max(start + attack + 0.01, end - release);

  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(frequency / sample.baseFrequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1500, start);
  filter.frequency.exponentialRampToValueAtTime(1100, end);
  filter.Q.setValueAtTime(0.28, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + attack);
  gain.gain.setTargetAtTime(sustainLevel, start + attack, 0.04);
  gain.gain.linearRampToValueAtTime(0.0001, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter);
  filter.connect(gain);
  connectToOutput(gain, output);

  source.start(start);
  source.stop(end + 0.1);
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
  const sample = ensurePianoSample(context);
  const source = context.createBufferSource();
  const mainGain = context.createGain();
  const filter = context.createBiquadFilter();
  const attack = Math.min(0.04, Math.max(0.012, duration * 0.16));
  const release = Math.min(0.24, Math.max(0.08, duration * 0.2));
  const sustainLevel = duration < 0.4 ? 0.14 : 0.2;
  const releaseStart = Math.max(start + attack + 0.03, end - release);

  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(frequency / sample.baseFrequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3600, start);
  filter.frequency.exponentialRampToValueAtTime(2100, end);
  filter.Q.setValueAtTime(0.5, start);
  mainGain.gain.setValueAtTime(0.0001, start);
  mainGain.gain.exponentialRampToValueAtTime(0.24, start + attack);
  mainGain.gain.setTargetAtTime(sustainLevel, start + attack, 0.08);
  mainGain.gain.linearRampToValueAtTime(0.0001, releaseStart);
  mainGain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter);
  filter.connect(mainGain);
  connectToOutput(mainGain, destination);

  source.start(start);
  source.stop(end + 0.15);
}
