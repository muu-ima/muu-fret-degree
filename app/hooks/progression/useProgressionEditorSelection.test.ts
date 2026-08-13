import { describe, expect, it } from "vitest";
import { getProgressionSelectionSlotIndex } from "./useProgressionEditorSelection";

describe("getProgressionSelectionSlotIndex", () => {
  it("uses the bar index for bar selections", () => {
    expect(getProgressionSelectionSlotIndex("bar", 3, 2)).toBe(3);
  });

  it("maps beats into two-beat cells for cell selections", () => {
    expect(getProgressionSelectionSlotIndex("cell", 0, 0)).toBe(0);
    expect(getProgressionSelectionSlotIndex("cell", 0, 1)).toBe(0);
    expect(getProgressionSelectionSlotIndex("cell", 0, 2)).toBe(1);
    expect(getProgressionSelectionSlotIndex("cell", 2, 3)).toBe(5);
  });

  it("maps every beat to its own slot for beat selections", () => {
    expect(getProgressionSelectionSlotIndex("beat", 0, 0)).toBe(0);
    expect(getProgressionSelectionSlotIndex("beat", 0, 3)).toBe(3);
    expect(getProgressionSelectionSlotIndex("beat", 2, 1)).toBe(9);
  });
});
