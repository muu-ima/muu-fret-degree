import { describe, expect, it, vi } from "vitest";
import { createPolyrhythmPlayback, getPolyrhythmPulses, polyrhythmRatios } from "./polyrhythm";

describe("polyrhythm training", () => {
  it.each(polyrhythmRatios)("spaces both voices evenly in $label and aligns their first hit", (ratio) => {
    const pulses = getPolyrhythmPulses(ratio);
    const high = pulses.filter((pulse) => pulse.high !== null).map((pulse) => pulse.progress);
    const low = pulses.filter((pulse) => pulse.low !== null).map((pulse) => pulse.progress);

    expect(high).toEqual(Array.from({ length: ratio.high }, (_, index) => index / ratio.high));
    expect(low).toEqual(Array.from({ length: ratio.low }, (_, index) => index / ratio.low));
    expect(pulses.filter((pulse) => pulse.high !== null && pulse.low !== null)).toEqual([
      { progress: 0, high: 0, low: 0 },
    ]);
  });

  it("aligns triplets and sixteenths every two beats and applies tempo changes at the next alignment", () => {
    const play = vi.fn();
    let bpm = 120;
    const playback = createPolyrhythmPlayback({
      ratio: polyrhythmRatios[0], firstStart: 4, getBpm: () => bpm, play,
    });

    playback.pump(3.95, 0.1);
    expect(play).toHaveBeenLastCalledWith(4, { progress: 0, high: 0, low: 0 });
    expect(playback.getFrame(3.99)).toEqual({ progress: 0, hit: null });
    expect(playback.getFrame(4.02).hit).toEqual({ progress: 0, high: 0, low: 0 });

    bpm = 60;
    playback.pump(4.24, 0.1);
    expect(play).toHaveBeenNthCalledWith(2, 4.25, { progress: 1 / 4, high: 1, low: null });
    expect(play).toHaveBeenLastCalledWith(4 + 1 / 3, { progress: 1 / 3, high: null, low: 1 });

    playback.pump(4.45, 0.1);
    expect(play).toHaveBeenLastCalledWith(4.5, { progress: 1 / 2, high: 2, low: null });
    expect(playback.getFrame(4.5).progress).toBe(0.5);

    playback.pump(4.95, 0.1);
    expect(play).toHaveBeenLastCalledWith(5, { progress: 0, high: 0, low: 0 });
    expect(playback.getFrame(4.98).progress).toBeCloseTo(0.98);
    expect(playback.getFrame(5.5).progress).toBe(0.25);
    playback.pump(5.63, 0.1);
    expect(play).toHaveBeenLastCalledWith(5 + 2 / 3, { progress: 1 / 3, high: null, low: 1 });
  });

  it("skips expired clicks after polling falls behind", () => {
    const play = vi.fn();
    const playback = createPolyrhythmPlayback({
      ratio: polyrhythmRatios[0], firstStart: 1, getBpm: () => 120, play,
    });

    playback.pump(100.29, 0.1);
    expect(play.mock.calls).toEqual([[100 + 1 / 3, { progress: 1 / 3, high: null, low: 1 }]]);
    expect(playback.getFrame(100.34).hit?.low).toBe(1);
  });
});
