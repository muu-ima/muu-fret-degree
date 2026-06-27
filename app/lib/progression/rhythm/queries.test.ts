import { describe, expect, it } from "vitest";
import {
  applyProgressionRhythmPreset,
  createDefaultProgression,
} from "../index";
import {
  getProgressionTickRhythmEventsAtBeat,
  hasProgressionNonStepTickRhythmAtBeat,
} from "./queries";

describe("progression tick rhythm beat queries", () => {
  it("detects triplet pulses only on the beat that contains them", () => {
    const progression = applyProgressionRhythmPreset(
      createDefaultProgression(),
      0,
      0,
      "triplet-eighths",
    );

    expect(hasProgressionNonStepTickRhythmAtBeat(progression.bars[0], 0)).toBe(true);
    expect(hasProgressionNonStepTickRhythmAtBeat(progression.bars[0], 1)).toBe(false);
    expect(getProgressionTickRhythmEventsAtBeat(progression.bars[0], 0)).toHaveLength(3);
    expect(getProgressionTickRhythmEventsAtBeat(progression.bars[0], 1)).toHaveLength(0);
  });
});
