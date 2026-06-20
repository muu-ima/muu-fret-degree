import { describe, expect, it } from "vitest";
import {
  createDefaultProgression,
  getProgressionPosition,
  updateProgressionBeatEventType,
  updateProgressionRhythmEvent,
} from "./progression";
import { getProgressionStepPlaybackRequest } from "./progression-scheduler";

function positionAtStep(step: number) {
  return getProgressionPosition(step * 0.125, 120, {
    beatsPerBar: 4,
    beatUnit: 4,
  });
}

describe("progression step scheduling", () => {
  it("keeps empty subdivisions silent", () => {
    const progression = createDefaultProgression(120);

    expect(getProgressionStepPlaybackRequest(progression, positionAtStep(1))).toBeUndefined();
  });

  it("returns each explicit sixteenth-note hit in one beat", () => {
    let progression = createDefaultProgression(120);
    progression = updateProgressionRhythmEvent(progression, 0, 0, "hit", 1);
    progression = updateProgressionRhythmEvent(progression, 0, 1, "hit", 1);
    progression = updateProgressionRhythmEvent(progression, 0, 2, "hit", 1);
    progression = updateProgressionRhythmEvent(progression, 0, 3, "hit", 1);

    expect([0, 1, 2, 3].map((step) =>
      getProgressionStepPlaybackRequest(progression, positionAtStep(step)),
    )).toMatchObject([
      { startStep: 0, durationSteps: 1, beatEventType: "hit" },
      { startStep: 1, durationSteps: 1, beatEventType: "hit" },
      { startStep: 2, durationSteps: 1, beatEventType: "hit" },
      { startStep: 3, durationSteps: 1, beatEventType: "hit" },
    ]);
  });

  it("returns an explicit subdivision rest without producing a default hit", () => {
    const progression = updateProgressionRhythmEvent(
      createDefaultProgression(120),
      0,
      2,
      "rest",
      1,
    );

    expect(getProgressionStepPlaybackRequest(progression, positionAtStep(2))).toMatchObject({
      startStep: 2,
      durationSteps: 1,
      beatEventType: "rest",
    });
  });

  it("extends the last subdivision hit into a following tied beat", () => {
    let progression = createDefaultProgression(120);
    progression = updateProgressionRhythmEvent(progression, 0, 3, "hit", 1);
    progression = updateProgressionBeatEventType(progression, 0, 1, "tie");

    expect(getProgressionStepPlaybackRequest(progression, positionAtStep(0))).toMatchObject({
      followingTieBeats: 0,
    });
    expect(getProgressionStepPlaybackRequest(progression, positionAtStep(3))).toMatchObject({
      followingTieBeats: 1,
    });
  });
});
