import { describe, expect, it } from "vitest";
import { getProgressionRhythmEditStartStep } from "./useProgressionRhythmEditing";

describe("getProgressionRhythmEditStartStep", () => {
  it("maps beat and sixteenth position into an absolute step", () => {
    expect(getProgressionRhythmEditStartStep(0, 0)).toBe(0);
    expect(getProgressionRhythmEditStartStep(0, 3)).toBe(3);
    expect(getProgressionRhythmEditStartStep(2, 1)).toBe(9);
    expect(getProgressionRhythmEditStartStep(3, 3)).toBe(15);
  });
});
