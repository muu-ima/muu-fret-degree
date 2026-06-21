import { describe, expect, it } from "vitest";
import {
  getProgressionSixteenthStepFromTicks,
  getProgressionTimingBeats,
  getProgressionTimingGridUnitsPerBeat,
  getProgressionTimingTicks,
  progressionTicksPerBeat,
} from "./timing-grid";

describe("progression timing grid", () => {
  it("uses a 12-tick beat shared by sixteenth and triplet grids", () => {
    expect(progressionTicksPerBeat).toBe(12);
    expect(getProgressionTimingGridUnitsPerBeat("sixteenth")).toBe(4);
    expect(getProgressionTimingGridUnitsPerBeat("triplet")).toBe(3);
  });

  it("maps sixteenth units to three-tick intervals", () => {
    expect([0, 1, 2, 3, 4].map((unit) =>
      getProgressionTimingTicks("sixteenth", unit),
    )).toEqual([0, 3, 6, 9, 12]);
  });

  it("maps triplet units to exact one-third-beat intervals", () => {
    expect([0, 1, 2, 3].map((unit) =>
      getProgressionTimingTicks("triplet", unit),
    )).toEqual([0, 4, 8, 12]);
    expect(getProgressionTimingBeats("triplet", 1)).toBe(1 / 3);
    expect(getProgressionTimingBeats("triplet", 2)).toBe(2 / 3);
  });

  it("only converts tick positions represented by the legacy sixteenth-step model", () => {
    expect(getProgressionSixteenthStepFromTicks(6)).toBe(2);
    expect(getProgressionSixteenthStepFromTicks(4)).toBeUndefined();
    expect(getProgressionSixteenthStepFromTicks(8)).toBeUndefined();
  });
});
