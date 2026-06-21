import { describe, expect, it } from "vitest";
import {
  getProgressionGrooveBeatTime,
  getProgressionGrooveDelaySeconds,
  getProgressionGrooveDurationSeconds,
} from "./groove";

describe("progression groove timing", () => {
  it("keeps four straight steps equally spaced", () => {
    expect([0, 1, 2, 3, 4].map((step) =>
      getProgressionGrooveBeatTime(step, "straight"),
    )).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("maps four logical steps onto an eighth-note shuffle", () => {
    expect([0, 1, 2, 3, 4].map((step) =>
      getProgressionGrooveBeatTime(step, "shuffle"),
    )).toEqual([0, 1 / 3, 2 / 3, 5 / 6, 1]);
  });

  it("returns only the additional scheduling delay", () => {
    expect(getProgressionGrooveDelaySeconds(0, 120, "shuffle")).toBe(0);
    expect(getProgressionGrooveDelaySeconds(1, 120, "shuffle")).toBeCloseTo(1 / 24);
    expect(getProgressionGrooveDelaySeconds(2, 120, "shuffle")).toBeCloseTo(1 / 12);
    expect(getProgressionGrooveDelaySeconds(3, 120, "shuffle")).toBeCloseTo(1 / 24);
    expect(getProgressionGrooveDelaySeconds(2, 120, "straight")).toBe(0);
  });

  it("derives long and short eighth durations from the same mapping", () => {
    expect(getProgressionGrooveDurationSeconds(0, 2, 120, "shuffle")).toBeCloseTo(1 / 3);
    expect(getProgressionGrooveDurationSeconds(2, 2, 120, "shuffle")).toBeCloseTo(1 / 6);
    expect(getProgressionGrooveDurationSeconds(0, 2, 120, "straight")).toBeCloseTo(1 / 4);
  });

  it("keeps durations correct across the next beat", () => {
    expect(getProgressionGrooveDurationSeconds(3, 3, 120, "shuffle")).toBeCloseTo(5 / 12);
  });
});
