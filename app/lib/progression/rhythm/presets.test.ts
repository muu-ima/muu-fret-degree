import { describe, expect, it } from "vitest";
import {
  getProgressionRhythmPresetDefinition,
  getProgressionRhythmPresetSpanSteps,
  progressionRhythmPresets,
} from "./presets";

describe("progression rhythm preset catalog", () => {
  it("defines the current preset order and labels in one catalog", () => {
    expect(progressionRhythmPresets.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "quarters", label: "Quarter ×1" },
      { id: "eighths", label: "8ths ×2" },
      { id: "sixteenths", label: "16ths ×4" },
      { id: "dotted-quarter-eighth", label: "Dotted 1/4 + 1/8" },
    ]);
  });

  it("keeps every event inside its preset span", () => {
    for (const preset of progressionRhythmPresets) {
      const spanSteps = getProgressionRhythmPresetSpanSteps(preset);
      expect(preset.timingGrid).toBe("sixteenth");
      expect(preset.events.every(
        (event) => event.startStep >= 0 && event.startStep + event.durationSteps <= spanSteps,
      )).toBe(true);
    }
  });

  it("looks up a preset definition by id", () => {
    expect(getProgressionRhythmPresetDefinition("dotted-quarter-eighth")).toMatchObject({
      spanBeats: 2,
      events: [
        { startStep: 0, durationSteps: 6 },
        { startStep: 6, durationSteps: 2 },
      ],
    });
  });
});
