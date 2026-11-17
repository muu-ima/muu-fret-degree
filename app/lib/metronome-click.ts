import type { MetronomeClickKind } from "./audio";

// Beat and pulse positions are zero-based for both playback clients.
export function getMetronomeClickKind(
  accentEnabled: boolean,
  beat: number,
  pulse: number,
): MetronomeClickKind {
  if (!accentEnabled || pulse !== 0) return "subdivision";
  return beat === 0 ? "accent" : "beat";
}
