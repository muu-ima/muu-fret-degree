import type { ChordSegment } from "@audio/mir-chordino";
import { describe, expect, it } from "vitest";
import { buildAudioChordChart } from "./audio-chord-chart";

function chord(label: string, time: number, duration: number): ChordSegment {
  return { label, time, duration, quality: "maj", root: 0, bass: 0, confidence: 1 };
}

const commonTime = { bpm: 120, beatsPerBar: 4, firstBarStart: 0 };

describe("buildAudioChordChart", () => {
  it("shows changes within a bar and carries a sustained chord into the next bar", () => {
    const { bars, count } = buildAudioChordChart(
      [chord("C", 0, 1), chord("F", 1, 2), chord("G", 3, 1)],
      4,
      commonTime,
    );

    expect(count).toBe(2);
    expect(bars.map((bar) => bar.chords.map(({ segment, start }) => [segment.label, start]))).toEqual([
      [["C", 0], ["F", 1]],
      [["F", 2], ["G", 3]],
    ]);
    expect(bars.every((bar) => !bar.partial)).toBe(true);
  });

  it("starts a boundary change in the next bar and counts a short final bar", () => {
    const { bars, count } = buildAudioChordChart([chord("C", 0, 2), chord("F", 2, 0.25)], 2.25, commonTime);

    expect(count).toBe(2);
    expect(bars.map((bar) => bar.chords.map(({ segment }) => segment.label))).toEqual([["C"], ["F"]]);
    expect(bars.map((bar) => bar.partial)).toEqual([false, true]);
  });

  it("aligns frame-level changes near a bar line without changing the source timestamps", () => {
    const { bars } = buildAudioChordChart([chord("C", 0, 2.04), chord("F", 2.04, 1.96)], 4, commonTime);

    expect(bars.map((bar) => bar.chords.map(({ segment, start }) => [segment.label, segment.time, start]))).toEqual([
      [["C", 0, 0]],
      [["F", 2.04, 2]],
    ]);
  });

  it("keeps audio before the first bar outside the count and honors three beats per bar", () => {
    const { bars, count } = buildAudioChordChart([chord("C", 0, 3.5)], 3.5, {
      ...commonTime,
      beatsPerBar: 3,
      firstBarStart: 0.5,
    });

    expect(count).toBe(2);
    expect(bars.map(({ number, start }) => [number, start])).toEqual([[0, 0], [1, 0.5], [2, 2]]);
  });
});
