import { describe, expect, it } from "vitest";
import {
  getProgressionHarmonySlotIndex,
  getProgressionHarmonySlotTarget,
} from "./useProgressionHarmonyEditing";

describe("getProgressionHarmonySlotIndex", () => {
  it("maps every beat when editing beat overrides", () => {
    expect(getProgressionHarmonySlotIndex("beat", 0, 0, 0)).toBe(0);
    expect(getProgressionHarmonySlotIndex("beat", 0, 3, 1)).toBe(3);
    expect(getProgressionHarmonySlotIndex("beat", 2, 1, 0)).toBe(9);
  });

  it("maps two-beat cells when editing base cells", () => {
    expect(getProgressionHarmonySlotIndex("cell", 0, 0, 0)).toBe(0);
    expect(getProgressionHarmonySlotIndex("cell", 0, 1, 0)).toBe(0);
    expect(getProgressionHarmonySlotIndex("cell", 0, 2, 1)).toBe(1);
    expect(getProgressionHarmonySlotIndex("cell", 2, 3, 1)).toBe(5);
  });
});

describe("getProgressionHarmonySlotTarget", () => {
  it("resolves beat slots back to bar and beat indexes", () => {
    expect(getProgressionHarmonySlotTarget("beat", 0)).toEqual({ barIndex: 0, slotIndex: 0 });
    expect(getProgressionHarmonySlotTarget("beat", 5)).toEqual({ barIndex: 1, slotIndex: 1 });
  });

  it("resolves cell slots back to bar and cell indexes", () => {
    expect(getProgressionHarmonySlotTarget("cell", 0)).toEqual({ barIndex: 0, slotIndex: 0 });
    expect(getProgressionHarmonySlotTarget("cell", 5)).toEqual({ barIndex: 2, slotIndex: 1 });
  });
});
