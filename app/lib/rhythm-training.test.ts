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

describe("rhythm selection", () => {
  it.each([5, 4, 3, 2] as const)("loops a single selected rhythm (%i pulses)", (pulses) => {
    for (let beat = 0; beat < 32; beat += 1) {
      const position = getRhythmTrainingBeat(beat, [pulses]);
      expect(position.pattern.pulses).toBe(pulses);
      expect(position.beat).toBe(beat % 4 + 1);
      expect(position.measure).toBe(Math.floor(beat % 8 / 4) + 1);
    }
  });

  it("skips unselected rhythms, preserves display order, and wraps after two bars each", () => {
    const positions = Array.from({ length: 32 }, (_, beat) => getRhythmTrainingBeat(beat, [3, 4]));
    expect(positions.map((position) => position.pattern.pulses)).toEqual([
      ...Array(8).fill(4), ...Array(8).fill(3), ...Array(8).fill(4), ...Array(8).fill(3),
    ]);
    expect(positions[0].patternIndex).toBe(1);
    expect(positions[8].patternIndex).toBe(2);
    expect(positions[8].measure).toBe(1);
    expect(positions[8].beat).toBe(1);
  });

  it("rejects an empty selection", () => {
    expect(() => getRhythmTrainingBeat(0, [])).toThrow("Select at least one training rhythm.");
  });
});
