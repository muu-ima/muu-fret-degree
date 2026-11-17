import { describe, expect, it } from "vitest";
import { getRhythmTrainingBeat } from "./rhythm-training";

describe("rhythm training sequence", () => {
  it("plays each subdivision for exactly two 4/4 measures and loops", () => {
    const beats = Array.from({ length: 64 }, (_, beat) => getRhythmTrainingBeat(beat));
    for (let block = 0; block < 8; block += 1) {
      const section = beats.slice(block * 8, block * 8 + 8);
      expect(section.map((beat) => beat.pattern.pulses)).toEqual(Array(8).fill([5, 4, 3, 2][block % 4]));
      expect(section.map((beat) => beat.measure)).toEqual([1, 1, 1, 1, 2, 2, 2, 2]);
      expect(section.map((beat) => beat.beat)).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    }
    expect(beats.slice(0, 32).reduce((sum, beat) => sum + beat.pattern.pulses, 0)).toBe(112);
  });
});
