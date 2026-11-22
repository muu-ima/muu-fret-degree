import { playMetronomeClick } from "./audio";
import type { MetronomeAudioSession } from "./metronome-playback";

export function createMetronomeAudioSession(context: AudioContext, destination: AudioNode): MetronomeAudioSession {
  const ready = context.resume();
  const output = context.createGain();
  output.connect(destination);
  let stopped = false;
  return {
    ready,
    now: () => context.currentTime,
    play: (time, kind, tone, volume) => {
      if (!stopped) playMetronomeClick(context, time, kind, tone, volume, output);
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      output.gain.setValueAtTime(0, context.currentTime);
      output.disconnect();
    },
  };
}
