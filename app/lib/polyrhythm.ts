const cycleBeats = 2;

type PolyrhythmVoice = {
  name: string;
  subdivisionsPerBeat: number;
  playEvery: 1 | 2;
};

const subdivisions = {
  eighths: { name: "8分音符", subdivisionsPerBeat: 2, playEvery: 2 },
  triplets: { name: "三連符", subdivisionsPerBeat: 3, playEvery: 2 },
  sixteenths: { name: "16分音符", subdivisionsPerBeat: 4, playEvery: 2 },
  quintuplets: { name: "五連符", subdivisionsPerBeat: 5, playEvery: 2 },
} as const satisfies Record<string, PolyrhythmVoice>;

export const polyrhythmRatios = [
  { label: "4:3", high: subdivisions.sixteenths, low: subdivisions.triplets },
  {
    label: "8:3",
    high: { ...subdivisions.sixteenths, playEvery: 1 },
    low: { ...subdivisions.triplets, name: "2拍3連" },
  },
  { label: "3:2", high: subdivisions.triplets, low: subdivisions.eighths },
  { label: "5:4", high: subdivisions.quintuplets, low: subdivisions.sixteenths },
] as const;

export type PolyrhythmRatio = typeof polyrhythmRatios[number];

function getVoiceHitCount(voice: PolyrhythmVoice) {
  return cycleBeats * voice.subdivisionsPerBeat / voice.playEvery;
}

export function getPolyrhythmRests(voice: PolyrhythmVoice) {
  if (voice.playEvery === 1) return [];
  const hits = getVoiceHitCount(voice);
  return Array.from({ length: hits }, (_, index) => (index + 0.5) / hits);
}

export function getPolyrhythmPulses(ratio: PolyrhythmRatio) {
  const high = getVoiceHitCount(ratio.high);
  const low = getVoiceHitCount(ratio.low);
  const ticks = high * low;
  return Array.from({ length: ticks }, (_, tick) => ({
    progress: tick / ticks,
    high: tick % low === 0 ? tick / low : null,
    low: tick % high === 0 ? tick / high : null,
  })).filter((pulse) => pulse.high !== null || pulse.low !== null);
}

export type PolyrhythmPulse = ReturnType<typeof getPolyrhythmPulses>[number];

export function createPolyrhythmPlayback({
  ratio, firstStart, getBpm, play,
}: {
  ratio: PolyrhythmRatio;
  firstStart: number;
  getBpm: () => number;
  play: (time: number, pulse: PolyrhythmPulse) => void;
}) {
  const pulses = getPolyrhythmPulses(ratio);
  const fastestHitCount = getVoiceHitCount(ratio.high);
  const cycleDuration = () => cycleBeats * 60 / getBpm();
  let cycle = { start: firstStart, duration: cycleDuration() };
  let previousCycle = cycle;
  let nextPulse = 0;

  function pump(now: number, lookAhead: number) {
    const nextStart = cycle.start + cycle.duration;
    if (now >= nextStart) {
      const duration = cycleDuration();
      // Preserve the phase without replaying expired sounds after a blocked timer.
      const skippedCycles = Math.floor((now - nextStart) / duration);
      previousCycle = cycle;
      cycle = { start: nextStart + skippedCycles * duration, duration };
      nextPulse = 0;
    }
    const deadline = now + lookAhead;
    while (true) {
      const pulse = pulses[nextPulse];
      const time = cycle.start + (pulse?.progress ?? 1) * cycle.duration;
      if (time >= deadline) return;
      if (!pulse) {
        previousCycle = cycle;
        cycle = { start: time, duration: cycleDuration() };
        nextPulse = 0;
      } else {
        if (time >= now) play(time, pulse);
        nextPulse += 1;
      }
    }
  }

  function getFrame(now: number) {
    const current = now < cycle.start ? previousCycle : cycle;
    const elapsed = now - current.start;
    const progress = Math.max(0, Math.min(1, elapsed / current.duration));
    const flashSeconds = Math.min(0.12, current.duration / (fastestHitCount * 2));
    const isPlaying = progress < 1 && elapsed >= 0;
    const hit = isPlaying ? pulses.findLast((pulse) => pulse.progress <= progress) : undefined;
    return {
      progress,
      hit: hit && elapsed - hit.progress * current.duration < flashSeconds ? hit : null,
    };
  }

  return { pump, getFrame };
}
