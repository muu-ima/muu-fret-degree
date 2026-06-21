import { describe, expect, it } from "vitest";
import {
  getProgressionRhythmPresetDefinition,
  getProgressionRhythmPresetSpanUnits,
  getProgressionRhythmPresetStepEvents,
  progressionRhythmPresets,
  type ProgressionRhythmPresetDefinition,
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
      const spanUnits = getProgressionRhythmPresetSpanUnits(preset);
      expect(preset.timingGrid).toBe("sixteenth");
      expect(preset.events.every(
        (event) => event.startUnit >= 0 && event.startUnit + event.durationUnits <= spanUnits,
      )).toBe(true);
      expect(getProgressionRhythmPresetStepEvents(preset)).toHaveLength(preset.events.length);
    }
  });

  it("looks up a preset definition by id", () => {
    expect(getProgressionRhythmPresetDefinition("dotted-quarter-eighth")).toMatchObject({
      spanBeats: 2,
      events: [
        { startUnit: 0, durationUnits: 6 },
        { startUnit: 6, durationUnits: 2 },
      ],
    });
  });

  it("does not round a triplet-grid preset into legacy sixteenth steps", () => {
    const tripletPreset: ProgressionRhythmPresetDefinition = {
      id: "eighths",
      label: "Triplet draft",
      spanBeats: 1,
      timingGrid: "triplet",
      events: [
        { startUnit: 0, durationUnits: 1, eventType: "hit" },
        { startUnit: 1, durationUnits: 1, eventType: "hit" },
        { startUnit: 2, durationUnits: 1, eventType: "hit" },
      ],
    };

    expect(getProgressionRhythmPresetStepEvents(tripletPreset)).toBeUndefined();
  });
});
