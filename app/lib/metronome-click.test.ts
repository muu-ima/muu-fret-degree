import { describe, expect, it } from "vitest";
import { getMetronomeClickKind } from "./metronome-click";

describe("shared metronome and training accents", () => {
  it.each([1, 2, 3, 4, 5])("uses identical clicks everywhere with accents off (%i pulses)", (pulses) => {
    for (const beatsPerMeasure of [2, 3, 4, 6]) {
      const clicks = Array.from({ length: beatsPerMeasure * pulses * 2 }, (_, index) =>
        getMetronomeClickKind(false, Math.floor(index / pulses) % beatsPerMeasure, index % pulses),
      );
      expect(new Set(clicks)).toEqual(new Set(["subdivision"]));
    }
  });

  it("distinguishes measure heads, beat heads, and subdivisions when enabled", () => {
    expect(getMetronomeClickKind(true, 0, 0)).toBe("accent");
    expect(getMetronomeClickKind(true, 1, 0)).toBe("beat");
    expect(getMetronomeClickKind(true, 0, 1)).toBe("subdivision");
    expect(getMetronomeClickKind(true, 1, 1)).toBe("subdivision");
  });
});
