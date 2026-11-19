import type { MetronomeClickKind } from "./audio";

export const metronomeMixerChannels = [
  { id: "accent", label: "アクセント" },
  { id: "quarter", label: "4分" },
  { id: "eighth", label: "8分の裏" },
  { id: "sixteenth", label: "16分の裏" },
  { id: "triplet", label: "三連" },
] as const;
export type MetronomeMixerChannel = typeof metronomeMixerChannels[number]["id"];
export type MetronomeMix = Record<MetronomeMixerChannel, number>;
export const defaultMetronomeMix: MetronomeMix = { accent: 0, quarter: 1, eighth: 0, sixteenth: 0, triplet: 0 };
export const mixerStepsPerBeat = 12;

// A common grid keeps straight subdivisions and triplets on the same beat clock.
export function getMetronomeMixClicks(beat: number, step: number, mix: MetronomeMix) {
  const level = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const rhythmLevel =
    (step === 0 ? level(mix.quarter) : 0) +
    (step === 6 ? level(mix.eighth) : 0) +
    ((step === 3 || step === 9) ? level(mix.sixteenth) : 0) +
    (step % 4 === 0 ? level(mix.triplet) : 0);
  const clicks: Array<{ kind: MetronomeClickKind; volume: number }> = [];
  if (rhythmLevel > 0) clicks.push({ kind: "subdivision", volume: Math.min(1, rhythmLevel) });
  if (beat === 0 && step === 0 && level(mix.accent) > 0) {
    clicks.push({ kind: "accent", volume: level(mix.accent) });
  }
  return clicks;
}
