import { describe, expect, it } from "vitest";
import { isProgressionShortcutInputTarget } from "./useProgressionWorkspaceActions";

describe("isProgressionShortcutInputTarget", () => {
  it("allows shortcuts when no browser element target is available", () => {
    expect(isProgressionShortcutInputTarget(null)).toBe(false);
    expect(isProgressionShortcutInputTarget(new EventTarget())).toBe(false);
  });
});
