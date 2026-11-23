import { describe, expect, it, vi } from "vitest";
import { createPolyrhythmPlayback, getPolyrhythmPulses, getPolyrhythmRests, polyrhythmRatios } from "./polyrhythm";

describe("polyrhythm training", () => {
  it.each(polyrhythmRatios)("spaces both voices evenly in $label and aligns their first hit", (ratio) => {
    const pulses = getPolyrhythmPulses(ratio);
    const [highCount, lowCount] = ratio.label.split(":").map(Number);
    const high = pulses.filter((pulse) => pulse.high !== null).map((pulse) => pulse.progress);
    const low = pulses.filter((pulse) => pulse.low !== null).map((pulse) => pulse.progress);

    expect(high).toEqual(Array.from({ length: highCount }, (_, index) => index / highCount));
    expect(low).toEqual(Array.from({ length: lowCount }, (_, index) => index / lowCount));
    expect(pulses.filter((pulse) => pulse.high !== null && pulse.low !== null)).toEqual([
      { progress: 0, high: 0, low: 0 },
    ]);
  });

  it("plays all four sixteenth notes per beat while the three triplet hits span two beats", () => {
    const ratio = polyrhythmRatios[1];
    const play = vi.fn();
    const playback = createPolyrhythmPlayback({ ratio, firstStart: 1, getBpm: () => 60, play });

    for (let tick = 19; tick <= 59; tick++) playback.pump(tick / 20, 0.1);

    const firstCycle = play.mock.calls.filter(([time]) => time < 3);
    expect(firstCycle.filter(([, pulse]) => pulse.high !== null).map(([time]) => time)).toEqual([
      1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75,
    ]);
    expect(firstCycle.filter(([, pulse]) => pulse.low !== null).map(([time]) => time)).toEqual([
      1, 1 + 2 / 3, 1 + 4 / 3,
    ]);
    expect(play).toHaveBeenLastCalledWith(3, { progress: 0, high: 0, low: 0 });
    expect(getPolyrhythmRests(ratio.high)).toEqual([]);
    expect(getPolyrhythmRests(ratio.low)).toEqual([1 / 6, 1 / 2, 5 / 6]);
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
