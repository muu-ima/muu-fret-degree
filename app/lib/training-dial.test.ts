import { describe, expect, it } from "vitest";
import { getTrainingDialTapValue } from "./training-dial";

describe("training dial tap", () => {
  it("maps the arc endpoints and top to the displayed tempo scale", () => {
    expect(getTrainingDialTapValue(-0.5, 0.5, 40, 240)).toBe(40);
    expect(getTrainingDialTapValue(0, -0.8, 40, 240)).toBe(140);
    expect(getTrainingDialTapValue(0.5, 0.5, 40, 240)).toBe(240);
    expect(getTrainingDialTapValue(-0.8, 0, 40, 240)).toBe(73);
    expect(getTrainingDialTapValue(0.8, 0, 40, 240)).toBe(207);
  });
  it("maps to integer measure counts regardless of distance from the centre", () => {
    expect(getTrainingDialTapValue(-0.5, 0.5, 1, 32)).toBe(1);
    expect(getTrainingDialTapValue(0, -0.8, 1, 32)).toBe(17);
    expect(getTrainingDialTapValue(0, -0.4, 1, 32)).toBe(17);
    expect(getTrainingDialTapValue(0.5, 0.5, 1, 32)).toBe(32);
  });
  it("ignores the centre, inactive bottom gap, and points outside the dial", () => {
    for (const [x, y] of [[0, 0], [0.1, 0], [0, 0.8], [-0.1, 0.8], [0.1, 0.8], [1, 1], [NaN, 0]]) {
      expect(getTrainingDialTapValue(x, y, 40, 240)).toBeNull();
    }
  });
});
