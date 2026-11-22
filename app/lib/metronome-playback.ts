import type { MetronomeClickKind, MetronomeTone } from "./audio";
import { getMetronomeMixClicks, mixerStepsPerBeat, type MetronomeMix } from "./metronome-mixer";

export type MetronomeAudioSession = {
  ready: Promise<void>;
  now: () => number;
  play: (time: number, kind: MetronomeClickKind, tone: MetronomeTone, volume: number) => void;
  stop: () => void;
};
export type MetronomePosition = {
  currentBeat: number;
  isCountingIn: boolean;
  countInBeatsRemaining: number;
};
type Settings = { bpm: number; mix: MetronomeMix; tone: MetronomeTone; volume: number };

export const metronomeLookAheadSeconds = 0.1;
export const metronomePollMs = 25;

// The polling timer only fills the audio queue. It never determines the click time.
export function createMetronomePlayback({
  audio, beatsPerMeasure, countInMeasures, settings, onPosition, onCountInComplete,
}: {
  audio: MetronomeAudioSession;
  beatsPerMeasure: number;
  countInMeasures: number;
  settings: () => Settings;
  onPosition: (position: MetronomePosition) => void;
  onCountInComplete?: () => void;
}) {
  const countInSteps = countInMeasures * beatsPerMeasure * mixerStepsPerBeat;
  let nextStep = 0;
  let nextTime = audio.now() + 0.05;
  let stopped = false;
  let countInEnd: number | null = null;
  let notified = false;
  let pending: Array<{ time: number; position: MetronomePosition }> = [];

  function position(step: number): MetronomePosition {
    const countingIn = step < countInSteps;
    const playbackStep = countingIn ? step : step - countInSteps;
    return {
      currentBeat: Math.floor(playbackStep / mixerStepsPerBeat) % beatsPerMeasure + 1,
      isCountingIn: countingIn,
      countInBeatsRemaining: countingIn ? Math.ceil((countInSteps - step) / mixerStepsPerBeat) : 0,
    };
  }

  function pump() {
    if (stopped) return;
    const now = audio.now();
    const sound = settings();
    const stepDuration = 60 / sound.bpm / mixerStepsPerBeat;

    // After a long blocked/background interval, skip expired clicks rather than burst them.
    if (nextTime < now) {
      const skipped = Math.ceil((now - nextTime) / stepDuration);
      if (countInSteps > 0 && nextStep <= countInSteps && nextStep + skipped > countInSteps) {
        countInEnd = nextTime + (countInSteps - nextStep) * stepDuration;
      }
      nextStep += skipped;
      nextTime += skipped * stepDuration;
      pending = [{ time: now, position: position(nextStep - 1) }];
    }

    while (nextTime < now + metronomeLookAheadSeconds) {
      const current = position(nextStep);
      const pulse = nextStep % mixerStepsPerBeat;
      if (countInSteps > 0 && nextStep === countInSteps) countInEnd = nextTime;
      if (pulse === 0) pending.push({ time: nextTime, position: current });
      const clicks = current.isCountingIn
        ? pulse === 0 ? [{ kind: "beat" as const, volume: 1 }] : []
        : getMetronomeMixClicks(current.currentBeat - 1, pulse, sound.mix);
      for (const click of clicks) {
        if (sound.volume > 0) audio.play(nextTime, click.kind, sound.tone, click.volume * sound.volume);
      }
      nextStep += 1;
      nextTime += stepDuration;
    }

    let latest: MetronomePosition | undefined;
    while (pending.length && pending[0].time <= now) latest = pending.shift()!.position;
    if (latest) onPosition(latest);
    // Never start the progression merely because its first click was queued ahead.
    if (!stopped && !notified && countInEnd !== null && now >= countInEnd) {
      notified = true;
      onCountInComplete?.();
    }
  }

  return {
    pump,
    stop() {
      if (stopped) return;
      stopped = true;
      pending = [];
      audio.stop();
    },
  };
}
