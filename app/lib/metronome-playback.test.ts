import { describe, expect, it, vi } from "vitest";
import { createMetronomePlayback, type MetronomeAudioSession } from "./metronome-playback";
import { defaultMetronomeMix } from "./metronome-mixer";

function setup(countInMeasures = 0, beatsPerMeasure = 4) {
  let now = 0;
  const sound = { bpm: 120, mix: { ...defaultMetronomeMix }, tone: "wood" as const, volume: 0.7 };
  const audio: MetronomeAudioSession = { now: () => now, ready: Promise.resolve(), play: vi.fn(), stop: vi.fn() };
  const onPosition = vi.fn();
  const onCountInComplete = vi.fn();
  const playback = createMetronomePlayback({ audio, beatsPerMeasure, countInMeasures, settings: () => sound, onPosition, onCountInComplete });
  return { playback, audio, sound, onPosition, onCountInComplete, at(time: number) { now = time; playback.pump(); } };
}

describe("audio-clock metronome scheduler", () => {
  it("keeps click times on the audio grid despite irregular polling", () => {
    const run = setup();
    run.sound.mix = { ...run.sound.mix, eighth: 1, sixteenth: 1, triplet: 1 };
    run.at(0);
    let time = 0;
    const delays = [0.019, 0.061, 0.027, 0.044];
    for (let i = 0; time < 8; i++) { time += delays[i % delays.length]; run.at(time); }
    const calls = vi.mocked(run.audio.play).mock.calls;
    expect(calls.length).toBeGreaterThan(90);
    calls.forEach(([at], index) => {
      const beat = Math.floor(index / 6);
      const step = [0, 3, 4, 6, 8, 9][index % 6];
      expect(at).toBeCloseTo(0.05 + beat * 0.5 + step * 0.5 / 12, 9);
    });
  });

  it("does not display or complete count-in when its audio was merely queued", () => {
    const run = setup(1);
    run.at(0);
    expect(run.onPosition).not.toHaveBeenCalled();
    for (let t = 0.05; t < 2; t += 0.025) run.at(t);
    run.at(2.01);
    expect(vi.mocked(run.audio.play).mock.calls.some(([time]) => Math.abs(time - 2.05) < 0.000001)).toBe(true);
    expect(run.onCountInComplete).not.toHaveBeenCalled();
    run.at(2.06);
    expect(run.onCountInComplete).toHaveBeenCalledTimes(1);
    expect(run.onPosition).toHaveBeenLastCalledWith({ currentBeat: 1, isCountingIn: false, countInBeatsRemaining: 0 });
    run.at(2.09);
    expect(run.onCountInComplete).toHaveBeenCalledTimes(1);
  });

  it("counts in with quarter notes even when all mixer channels are muted", () => {
    const run = setup(2, 3);
    run.sound.mix = { accent: 0, quarter: 0, eighth: 0, sixteenth: 0, triplet: 0 };
    for (let t = 0; t < 4; t += 0.025) run.at(t);
    const calls = vi.mocked(run.audio.play).mock.calls;
    expect(calls).toHaveLength(6);
    calls.forEach(([time, kind, , volume], index) => {
      expect(time).toBeCloseTo(0.05 + index * 0.5, 9);
      expect(kind).toBe("beat");
      expect(volume).toBe(0.7);
    });
    expect(run.onCountInComplete).toHaveBeenCalledTimes(1);
  });

  it("does not replay expired clicks after a long stall", () => {
    const run = setup(1);
    run.at(0);
    vi.mocked(run.audio.play).mockClear();
    run.at(30);
    expect(vi.mocked(run.audio.play).mock.calls.every(([time]) => time >= 30)).toBe(true);
    expect(vi.mocked(run.audio.play).mock.calls.length).toBeLessThanOrEqual(1);
    expect(run.onCountInComplete).toHaveBeenCalledTimes(1);
    run.at(30.025);
    expect(run.onCountInComplete).toHaveBeenCalledTimes(1);
  });

  it("applies tempo and mixer changes without restarting the count-in or beat counter", () => {
    const run = setup();
    for (let t = 0; t < 0.4; t += 0.025) run.at(t);
    const before = vi.mocked(run.audio.play).mock.calls.length;
    run.sound.bpm = 60;
    run.sound.mix.quarter = 0.5;
    for (let t = 0.4; t < 3; t += 0.025) run.at(t);
    const after = vi.mocked(run.audio.play).mock.calls.slice(before);
    expect(after.length).toBeGreaterThan(1);
    expect(after[1][0] - after[0][0]).toBeCloseTo(1, 9);
    expect(after.every(([, , , volume]) => volume === 0.35)).toBe(true);
    expect(run.onCountInComplete).not.toHaveBeenCalled();
    expect(run.onPosition.mock.calls.some(([pos]) => pos.currentBeat === 2)).toBe(true);
  });

  it("disconnects pending audio and prevents late notifications when stopped", () => {
    const run = setup(1);
    run.at(0);
    run.playback.stop();
    run.playback.stop();
    vi.mocked(run.audio.play).mockClear();
    run.onPosition.mockClear();
    run.at(5);
    expect(run.audio.stop).toHaveBeenCalledTimes(1);
    expect(run.audio.play).not.toHaveBeenCalled();
    expect(run.onPosition).not.toHaveBeenCalled();
    expect(run.onCountInComplete).not.toHaveBeenCalled();
  });
});
