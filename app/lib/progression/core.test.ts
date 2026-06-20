import { describe, expect, it } from "vitest";
import {
  applyProgressionBeatSubdivision,
  canTieProgressionBeat,
  countFollowingProgressionTies,
  createDefaultProgression,
  getProgressionBeatEventType,
  getProgressionBeatDuration,
  getProgressionBeatSubdivision,
  getProgressionCellForBeat,
  getProgressionPosition,
  getProgressionRhythmEvents,
  getProgressionSustainingEventAtStep,
  isProgressionBeatStart,
  progressionStepsPerBeat,
  removeProgressionRhythmEvent,
  updateProgressionBeatChord,
  updateProgressionBeatEventType,
  updateProgressionBeatDuration,
  updateProgressionRhythmEvent,
} from ".";

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
    expect(rested.bars[0].rhythm?.find((event) => event.startStep === 0)?.eventType).toBe(
      "rest",
    );

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
    expect(hit.bars[0].rhythm).toBeUndefined();
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
    expect(
      dottedEighth.bars[0].rhythm?.find((event) => event.startStep === 0)?.durationSteps,
    ).toBe(3);

    const quarter = updateProgressionBeatDuration(dottedEighth, 0, 0, 4);
    expect(getProgressionBeatDuration(quarter.bars[0], 0)).toBe(4);
    expect(quarter.bars[0].rhythm).toBeUndefined();
  });

  it("exposes a complete four-beat rhythm while storing only overrides", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 1, 2);
    const events = getProgressionRhythmEvents(progression.bars[0]);

    expect(events.map((event) => event.startStep)).toEqual([0, 4, 8, 12]);
    expect(events.map((event) => event.durationSteps)).toEqual([4, 2, 4, 4]);
    expect(progression.bars[0].rhythm).toHaveLength(1);
  });

  it("adds and removes an event at an arbitrary sixteenth-note step", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 0, 2);
    const added = updateProgressionRhythmEvent(progression, 0, 2, "hit", 2);

    expect(getProgressionRhythmEvents(added.bars[0])).toEqual([
      { startStep: 0, durationSteps: 2, eventType: "hit" },
      { startStep: 2, durationSteps: 2, eventType: "hit" },
      { startStep: 4, durationSteps: 4, eventType: "hit" },
      { startStep: 8, durationSteps: 4, eventType: "hit" },
      { startStep: 12, durationSteps: 4, eventType: "hit" },
    ]);

    const removed = removeProgressionRhythmEvent(added, 0, 2);

    expect(getProgressionRhythmEvents(removed.bars[0])).toEqual([
      { startStep: 0, durationSteps: 2, eventType: "hit" },
      { startStep: 4, durationSteps: 4, eventType: "hit" },
      { startStep: 8, durationSteps: 4, eventType: "hit" },
      { startStep: 12, durationSteps: 4, eventType: "hit" },
    ]);
  });

  it("rejects rhythm events that extend beyond the bar", () => {
    const progression = createDefaultProgression();

    expect(updateProgressionRhythmEvent(progression, 0, 15, "hit", 2)).toBe(
      progression,
    );
  });

  it("identifies steps held by eighth and dotted-eighth notes", () => {
    let progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 0, 2);

    expect(getProgressionSustainingEventAtStep(progression.bars[0], 1)?.startStep).toBe(0);
    expect(getProgressionSustainingEventAtStep(progression.bars[0], 2)).toBeUndefined();

    progression = updateProgressionBeatDuration(progression, 0, 0, 3);

    expect(getProgressionSustainingEventAtStep(progression.bars[0], 2)?.startStep).toBe(0);
    expect(getProgressionSustainingEventAtStep(progression.bars[0], 3)).toBeUndefined();
  });

  it("lets a dotted-quarter hit cover the following beat head", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 0, 6);
    const events = getProgressionRhythmEvents(progression.bars[0]);

    expect(events.map((event) => event.startStep)).toEqual([0, 8, 12]);
    expect(getProgressionBeatEventType(progression.bars[0], 1)).toBe("tie");
    expect(getProgressionSustainingEventAtStep(progression.bars[0], 4)?.startStep).toBe(0);
  });

  it("rejects a new hit on a beat covered by a dotted quarter", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 0, 6);

    const updated = updateProgressionBeatEventType(progression, 0, 1, "hit");

    expect(updated).toBe(progression);
    expect(getProgressionBeatDuration(updated.bars[0], 0)).toBe(6);
    expect(getProgressionBeatEventType(updated.bars[0], 1)).toBe("tie");
  });

  it("ties a dotted quarter from beat four into the next bar", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 3, 6);

    expect(progression.bars[0].rhythm).toContainEqual({
      startStep: 12,
      durationSteps: 6,
      eventType: "hit",
    });
    expect(progression.bars[1].rhythm).toContainEqual({
      startStep: 0,
      durationSteps: 4,
      eventType: "tie",
    });
  });

  it("rejects editing a next-bar head covered by a dotted quarter", () => {
    const progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 3, 6);

    const updated = updateProgressionBeatEventType(progression, 1, 0, "hit");

    expect(updated).toBe(progression);
    expect(getProgressionBeatDuration(updated.bars[0], 3)).toBe(6);
    expect(getProgressionBeatEventType(updated.bars[1], 0)).toBe("tie");
  });

  it("ties the final bar back into the first bar", () => {
    const progression = createDefaultProgression();
    const lastBarIndex = progression.bars.length - 1;
    const updated = updateProgressionBeatDuration(progression, lastBarIndex, 3, 6);

    expect(getProgressionBeatEventType(updated.bars[0], 0)).toBe("tie");
    expect(updated.bars[lastBarIndex].rhythm).toContainEqual({
      startStep: 12,
      durationSteps: 6,
      eventType: "hit",
    });
  });

  it("shortens a cross-bar dotted quarter when a preset edits the next bar", () => {
    let progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 3, 6);

    progression = applyProgressionBeatSubdivision(progression, 1, 0, "eighths");

    expect(getProgressionBeatDuration(progression.bars[0], 3)).toBe(4);
    expect(getProgressionBeatSubdivision(progression.bars[1], 0)).toBe("eighths");
  });

  it("removes an automatic tie when a preset replaces its dotted-quarter source", () => {
    let progression = updateProgressionBeatDuration(createDefaultProgression(), 0, 3, 6);

    progression = applyProgressionBeatSubdivision(progression, 0, 3, "sixteenths");

    expect(getProgressionBeatSubdivision(progression.bars[0], 3)).toBe("sixteenths");
    expect(getProgressionBeatEventType(progression.bars[1], 0)).toBe("hit");
  });

  it("applies two eighth-note hits to only the selected beat", () => {
    const progression = applyProgressionBeatSubdivision(
      createDefaultProgression(),
      0,
      1,
      "eighths",
    );

    expect(progression.bars[0].rhythm).toEqual([
      { startStep: 4, durationSteps: 2, eventType: "hit" },
      { startStep: 6, durationSteps: 2, eventType: "hit" },
    ]);
    expect(getProgressionBeatSubdivision(progression.bars[0], 1)).toBe("eighths");
    expect(getProgressionBeatDuration(progression.bars[0], 0)).toBe(4);
    expect(applyProgressionBeatSubdivision(progression, 0, 1, "eighths")).toBe(
      progression,
    );
  });

  it("replaces the selected beat with four sixteenth-note hits", () => {
    let progression = applyProgressionBeatSubdivision(
      createDefaultProgression(),
      0,
      0,
      "eighths",
    );
    progression = applyProgressionBeatSubdivision(progression, 0, 0, "sixteenths");

    expect(progression.bars[0].rhythm).toEqual([
      { startStep: 0, durationSteps: 1, eventType: "hit" },
      { startStep: 1, durationSteps: 1, eventType: "hit" },
      { startStep: 2, durationSteps: 1, eventType: "hit" },
      { startStep: 3, durationSteps: 1, eventType: "hit" },
    ]);
    expect(getProgressionBeatSubdivision(progression.bars[0], 0)).toBe("sixteenths");
  });
});
