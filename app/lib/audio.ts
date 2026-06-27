import { frequencyFromMidi } from "./music";

export type MetronomeClickKind = "accent" | "beat" | "subdivision";
export type MetronomeTone = "classic" | "soft" | "wood";
type AudioOutputNode = AudioNode;

type BassSample = {
  buffer: AudioBuffer;
  baseFrequency: number;
  kind: "generated" | "recorded";
};

type BassSampleState =
  | { status: "ready"; sample: BassSample }
  | { status: "loading"; promise: Promise<BassSample> }
  | { status: "failed"; sample: BassSample };

type PianoReverb = {
  convolver: ConvolverNode;
  dryGain: GainNode;
  wetGain: GainNode;
};

const bassSampleCache = new WeakMap<AudioContext, BassSampleState>();
const pianoReverbCache = new WeakMap<AudioContext, PianoReverb>();
const recordedBassSampleUrl = "/audio/bass-a1.wav";
const bassSampleDuration = 1.15;
const bassSampleBaseFrequency = 82.4068892282175;
const bassSampleAttack = 0.02;
const bassSampleDecay = 0.16;
const bassSampleRelease = 0.28;
const recordedBassMaxDuration = 0.9;
const recordedBassTrimThreshold = 0.006;
const recordedBassPreroll = 0.012;
const recordedBassTargetPeak = 0.62;
const pianoSampleAttack = 0.012;
const pianoReverbDuration = 1.35;

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

  return { buffer, baseFrequency: bassSampleBaseFrequency, kind: "generated" };
}

function prepareRecordedBassSample(context: AudioContext, sourceBuffer: AudioBuffer) {
  const sampleRate = sourceBuffer.sampleRate;
  const channelCount = sourceBuffer.numberOfChannels;
  const frameCount = sourceBuffer.length;
  let firstAudibleFrame = -1;
  let sourcePeak = 0;

  for (let i = 0; i < frameCount; i += 1) {
    let mono = 0;
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      mono += sourceBuffer.getChannelData(channelIndex)[i] ?? 0;
    }
    const amplitude = Math.abs(mono / channelCount);
    sourcePeak = Math.max(sourcePeak, amplitude);
    if (firstAudibleFrame < 0 && amplitude > recordedBassTrimThreshold) {
      firstAudibleFrame = i;
    }
  }

  const startFrame = Math.max(0, Math.max(0, firstAudibleFrame) - Math.round(sampleRate * recordedBassPreroll));
  const availableFrames = Math.max(1, frameCount - startFrame);
  const normalizedBuffer = context.createBuffer(1, availableFrames, sampleRate);
  const output = normalizedBuffer.getChannelData(0);
  const gain = sourcePeak > 0 ? Math.min(20, recordedBassTargetPeak / sourcePeak) : 1;

  for (let i = 0; i < availableFrames; i += 1) {
    let mono = 0;
    const sourceFrame = startFrame + i;
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      mono += sourceBuffer.getChannelData(channelIndex)[sourceFrame] ?? 0;
    }
    output[i] = (mono / channelCount) * gain;
  }

  return normalizedBuffer;
}

function ensureBassSample(context: AudioContext) {
  const cached = bassSampleCache.get(context);
  if (cached?.status === "ready" || cached?.status === "failed") {
    return cached.sample;
  }

  const fallbackSample = createBassSample(context);
  if (cached?.status === "loading") {
    return fallbackSample;
  }

  const promise = fetch(recordedBassSampleUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load bass sample: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      const sample = {
        buffer: prepareRecordedBassSample(context, buffer),
        baseFrequency: bassSampleBaseFrequency,
        kind: "recorded" as const,
      };
      bassSampleCache.set(context, { status: "ready", sample });
      return sample;
    })
    .catch(() => {
      bassSampleCache.set(context, { status: "failed", sample: fallbackSample });
      return fallbackSample;
    });

  bassSampleCache.set(context, { status: "loading", promise });
  return fallbackSample;
}

function createPianoSample(context: AudioContext, frequency: number, duration: number) {
  const sampleRate = context.sampleRate;
  const bufferDuration = duration + 0.35;
  const length = Math.ceil(sampleRate * bufferDuration);
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    const attackLevel = Math.min(1, time / pianoSampleAttack);
    const bodyLevel = 0.72 * Math.exp(-time / 5.2) + 0.28 * Math.exp(-time / 1.4);
    const envelope = attackLevel * bodyLevel;
    const strike = Math.exp(-time / 0.018);
    const body =
      Math.sin(2 * Math.PI * frequency * time) * 0.52 +
      Math.sin(2 * Math.PI * frequency * 2 * time) * 0.28 +
      Math.sin(2 * Math.PI * frequency * 3 * time) * 0.12 +
      Math.sin(2 * Math.PI * frequency * 4 * time) * 0.05 +
      Math.sin(2 * Math.PI * frequency * 5 * time) * 0.02;
    const brightness = 1 - Math.min(1, time / 0.22) * 0.38;
    channel[i] = body * envelope * brightness + strike * envelope * 0.018;
  }

  return buffer;
}

function createPianoReverb(context: AudioContext): PianoReverb {
  const convolver = context.createConvolver();
  const impulseLength = Math.ceil(context.sampleRate * pianoReverbDuration);
  const impulse = context.createBuffer(2, impulseLength, context.sampleRate);

  for (let channelIndex = 0; channelIndex < impulse.numberOfChannels; channelIndex += 1) {
    const channel = impulse.getChannelData(channelIndex);
    for (let i = 0; i < impulseLength; i += 1) {
      const time = i / context.sampleRate;
      const decay = Math.exp(-time / 0.24);
      const shimmer = Math.sin(2 * Math.PI * (260 + channelIndex * 17) * time) * 0.08;
      const tail = (Math.random() * 2 - 1) * 0.06;
      channel[i] = (shimmer + tail) * decay;
    }
  }

  convolver.buffer = impulse;

  const dryGain = context.createGain();
  dryGain.gain.setValueAtTime(0.84, context.currentTime);

  const wetGain = context.createGain();
  wetGain.gain.setValueAtTime(0.16, context.currentTime);

  return { convolver, dryGain, wetGain };
}

function ensurePianoReverb(context: AudioContext) {
  const cached = pianoReverbCache.get(context);
  if (cached) {
    return cached;
  }

  const reverb = createPianoReverb(context);
  pianoReverbCache.set(context, reverb);
  return reverb;
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
  const playbackDuration = sample.kind === "recorded"
    ? Math.min(duration, recordedBassMaxDuration)
    : duration;
  const playbackEnd = start + playbackDuration;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const attack = Math.min(0.03, Math.max(0.01, playbackDuration * 0.3));
  const release = sample.kind === "recorded"
    ? Math.min(0.08, Math.max(0.04, playbackDuration * 0.22))
    : Math.min(0.14, Math.max(0.06, playbackDuration * 0.45));
  const sustainLevel = playbackDuration < 0.2 ? 0.09 : 0.14;
  const releaseStart = Math.max(start + attack + 0.01, playbackEnd - release);

  source.buffer = sample.buffer;
  source.playbackRate.setValueAtTime(frequency / sample.baseFrequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1500, start);
  filter.frequency.exponentialRampToValueAtTime(1100, playbackEnd);
  filter.Q.setValueAtTime(0.28, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.18, start + attack);
  gain.gain.setTargetAtTime(sustainLevel, start + attack, 0.04);
  gain.gain.linearRampToValueAtTime(0.0001, releaseStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, playbackEnd);

  source.connect(filter);
  filter.connect(gain);
  connectToOutput(gain, output);

  source.start(start);
  source.stop(playbackEnd + 0.02);
}

export function playPianoNote(
  context: AudioContext,
  midi: number,
  startOffset = 0,
  duration = 3.2,
  destination: AudioOutputNode = context.destination,
) {
  const start = context.currentTime + startOffset;
  const end = start + duration;
  const frequency = frequencyFromMidi(midi);
  const reverb = ensurePianoReverb(context);
  const source = context.createBufferSource();
  const mainGain = context.createGain();
  const filter = context.createBiquadFilter();
  const attack = Math.min(0.04, Math.max(0.012, duration * 0.16));
  const release = Math.min(0.42, Math.max(0.14, duration * 0.18));
  const sustainLevel = duration < 0.4 ? 0.14 : 0.24;
  const releaseStart = Math.max(start + attack + 0.03, end - release);

  source.buffer = createPianoSample(context, frequency, duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3900, start);
  filter.frequency.exponentialRampToValueAtTime(1900, end);
  filter.Q.setValueAtTime(0.5, start);
  mainGain.gain.setValueAtTime(0.0001, start);
  mainGain.gain.exponentialRampToValueAtTime(0.26, start + attack);
  mainGain.gain.setTargetAtTime(sustainLevel, start + attack, 0.14);
  mainGain.gain.linearRampToValueAtTime(0.0001, releaseStart);
  mainGain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter);
  filter.connect(mainGain);
  mainGain.connect(reverb.dryGain);
  mainGain.connect(reverb.convolver);
  reverb.convolver.connect(reverb.wetGain);
  reverb.dryGain.connect(destination);
  reverb.wetGain.connect(destination);

  source.start(start);
  source.stop(end + 0.35);
}
