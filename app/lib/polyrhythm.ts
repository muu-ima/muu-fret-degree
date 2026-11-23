export const polyrhythmRatios = [
  { label: "3:2", high: 3, low: 2 },
  { label: "4:3", high: 4, low: 3 },
  { label: "5:4", high: 5, low: 4 },
] as const;

export type PolyrhythmRatio = typeof polyrhythmRatios[number];

export function getPolyrhythmPulses({ high, low }: PolyrhythmRatio) {
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
  const cycleDuration = () => ratio.low * 60 / getBpm();
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
    const flashSeconds = Math.min(0.12, current.duration / (ratio.high * 2));
    const isPlaying = progress < 1 && elapsed >= 0;
    const hit = isPlaying ? pulses.findLast((pulse) => pulse.progress <= progress) : undefined;
    return {
      progress,
      hit: hit && elapsed - hit.progress * current.duration < flashSeconds ? hit : null,
    };
  }

  return { pump, getFrame };
}
