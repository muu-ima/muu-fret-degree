import { describe, expect, it } from "vitest";
import {
  canTieProgressionBeat,
  countFollowingProgressionTies,
  createDefaultProgression,
  getProgressionBeatEventType,
  getProgressionBeatDuration,
  getProgressionCellForBeat,
  getProgressionPosition,
  isProgressionBeatStart,
  progressionStepsPerBeat,
  updateProgressionBeatChord,
  updateProgressionBeatEventType,
  updateProgressionBeatDuration,
} from "./progression";

describe("progression position", () => {
  it("tracks sixteenth-note steps without changing beat positions", () => {
    const timeSignature = { beatsPerBar: 4, beatUnit: 4 };

    expect(progressionStepsPerBeat).toBe(4);
    expect(getProgressionPosition(0.125, 120, timeSignature)).toMatchObject({
      beatIndex: 0,
      beatInBar: 0,
      stepIndex: 1,
      stepInBeat: 1,
      stepInBar: 1,
    });
    expect(getProgressionPosition(0.5, 120, timeSignature)).toMatchObject({
      beatIndex: 1,
      beatInBar: 1,
      stepIndex: 4,
      stepInBeat: 0,
      stepInBar: 4,
    });
  });

  it("wraps steps at the next bar", () => {
    const position = getProgressionPosition(2, 120, { beatsPerBar: 4, beatUnit: 4 });

    expect(position).toMatchObject({
      barIndex: 1,
      beatIndex: 4,
      beatInBar: 0,
      stepIndex: 16,
      stepInBeat: 0,
      stepInBar: 0,
    });
  });

  it("identifies only the first step of each beat as a beat start", () => {
    const timeSignature = { beatsPerBar: 4, beatUnit: 4 };

    expect(isProgressionBeatStart(getProgressionPosition(0.125, 120, timeSignature))).toBe(false);
    expect(isProgressionBeatStart(getProgressionPosition(0.5, 120, timeSignature))).toBe(true);
  });
});

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

describe("progression beat events", () => {
  it("treats existing beats as hits and stores only rests", () => {
    const progression = createDefaultProgression();

    expect(getProgressionBeatEventType(progression.bars[0], 0)).toBe("hit");

    const rested = updateProgressionBeatEventType(progression, 0, 0, "rest");

    expect(getProgressionBeatEventType(rested.bars[0], 0)).toBe("rest");
    expect(rested.bars[0].beats?.[0].eventType).toBe("rest");

    const hit = updateProgressionBeatEventType(rested, 0, 0, "hit");

    expect(getProgressionBeatEventType(hit.bars[0], 0)).toBe("hit");
    expect(hit.bars[0].beats).toBeUndefined();
  });

  it("preserves a chord override when changing the beat event", () => {
    const progression = createDefaultProgression();
    const override = { root: "F#", chordTypeId: "7" };
    const overridden = updateProgressionBeatChord(progression, 0, 1, override);

    const rested = updateProgressionBeatEventType(overridden, 0, 1, "rest");
    const hit = updateProgressionBeatEventType(rested, 0, 1, "hit");

    expect(getProgressionCellForBeat(rested.bars[0], 1)).toEqual(override);
    expect(getProgressionBeatEventType(rested.bars[0], 1)).toBe("rest");
    expect(getProgressionCellForBeat(hit.bars[0], 1)).toEqual(override);
    expect(hit.bars[0].beats?.[1].eventType).toBeUndefined();
  });

  it("counts consecutive ties within and across bars", () => {
    let progression = createDefaultProgression();
    progression = updateProgressionBeatEventType(progression, 0, 1, "tie");
    progression = updateProgressionBeatEventType(progression, 0, 2, "tie");
    progression = updateProgressionBeatEventType(progression, 1, 0, "tie");

    expect(countFollowingProgressionTies(progression, 0, 0)).toBe(2);
    expect(countFollowingProgressionTies(progression, 0, 3)).toBe(1);
    expect(countFollowingProgressionTies(progression, 1, 0)).toBe(0);
  });

  it("rejects a tie when the preceding event is a rest", () => {
    const progression = updateProgressionBeatEventType(
      createDefaultProgression(),
      0,
      0,
      "rest",
    );

    expect(canTieProgressionBeat(progression.bars, 0, 1)).toBe(false);
    expect(updateProgressionBeatEventType(progression, 0, 1, "tie")).toBe(progression);
  });

  it("turns following ties into rests when their source hit becomes a rest", () => {
    let progression = createDefaultProgression();
    progression = updateProgressionBeatEventType(progression, 0, 1, "tie");
    progression = updateProgressionBeatEventType(progression, 0, 2, "tie");

    progression = updateProgressionBeatEventType(progression, 0, 0, "rest");

    expect(getProgressionBeatEventType(progression.bars[0], 0)).toBe("rest");
    expect(getProgressionBeatEventType(progression.bars[0], 1)).toBe("rest");
    expect(getProgressionBeatEventType(progression.bars[0], 2)).toBe("rest");
    expect(getProgressionBeatEventType(progression.bars[0], 3)).toBe("hit");
  });

  it("stores short note values and removes the default quarter-note value", () => {
    const progression = createDefaultProgression();

    expect(getProgressionBeatDuration(progression.bars[0], 0)).toBe(4);

    const dottedEighth = updateProgressionBeatDuration(progression, 0, 0, 3);
    expect(getProgressionBeatDuration(dottedEighth.bars[0], 0)).toBe(3);
    expect(dottedEighth.bars[0].beats?.[0].durationSteps).toBe(3);

    const quarter = updateProgressionBeatDuration(dottedEighth, 0, 0, 4);
    expect(getProgressionBeatDuration(quarter.bars[0], 0)).toBe(4);
    expect(quarter.bars[0].beats).toBeUndefined();
  });
});
