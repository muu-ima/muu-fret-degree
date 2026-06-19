import { describe, expect, it } from "vitest";
import {
  createDefaultProgression,
  getProgressionCellForBeat,
  updateProgressionBeatChord,
} from "./progression";

describe("progression beat overrides", () => {
  it("overrides only the selected beat and restores the inherited cell", () => {
    const progression = createDefaultProgression();
    const override = { root: "F#", chordTypeId: "7" };

    const updated = updateProgressionBeatChord(progression, 0, 1, override);

    expect(getProgressionCellForBeat(updated.bars[0], 0)).toEqual(
      progression.bars[0].cells[0],
    );
    expect(getProgressionCellForBeat(updated.bars[0], 1)).toEqual(override);
    expect(getProgressionCellForBeat(updated.bars[0], 2)).toEqual(
      progression.bars[0].cells[1],
    );

    const restored = updateProgressionBeatChord(updated, 0, 1, undefined);

    expect(restored.bars[0].beats).toBeUndefined();
    expect(getProgressionCellForBeat(restored.bars[0], 1)).toEqual(
      progression.bars[0].cells[0],
    );
  });
});
