import { describe, expect, it } from "vitest";
import { createDefaultProgression } from "../model";
import {
  getProgressionTickPosition,
  getProgressionPositionFromTickIndex,
  getProgressionRhythmTickEventFromPresetEvent,
  getProgressionRhythmTickEventFromRhythmEvent,
  getProgressionSixteenthStepFromTickEvent,
  progressionTicksPerStep,
} from "./ticks";

describe("progression rhythm tick helpers", () => {
  it("uses three ticks per sixteenth-step", () => {
    expect(progressionTicksPerStep).toBe(3);
  });

  it("converts a stored rhythm event into ticks", () => {
    const event = createDefaultProgression().bars[0].rhythm?.[0] ?? {
      startStep: 0,
      durationSteps: 4 as const,
      eventType: "hit" as const,
    };

    expect(getProgressionRhythmTickEventFromRhythmEvent(event)).toEqual({
      startTick: 0,
      durationTicks: 12,
      eventType: "hit",
    });
  });

  it("converts a triplet-grid preset event into exact tick values", () => {
    expect(
      getProgressionRhythmTickEventFromPresetEvent("triplet", {
        startUnit: 1,
        durationUnits: 2,
        eventType: "hit",
      }),
    ).toEqual({
      startTick: 4,
      durationTicks: 8,
      eventType: "hit",
    });
  });

  it("round-trips tick events back to legacy sixteenth steps when possible", () => {
    expect(
      getProgressionSixteenthStepFromTickEvent({
        startTick: 6,
        durationTicks: 9,
        eventType: "rest",
      }),
    ).toEqual({
      startStep: 2,
      durationSteps: 3,
      eventType: "rest",
    });
  });

  it("converts a step position into ticks", () => {
    expect(
      getProgressionTickPosition({
        elapsedSeconds: 0,
        beatIndex: 1,
        barIndex: 0,
        beatInBar: 1,
        stepIndex: 5,
        stepInBeat: 2,
        stepInBar: 6,
      }),
    ).toEqual({
      tickIndex: 15,
      tickInBeat: 6,
      tickInBar: 18,
    });
  });

  it("converts a tick index into a progression position", () => {
    expect(
      getProgressionPositionFromTickIndex(0, {
        beatsPerBar: 4,
        beatUnit: 4,
      }),
    ).toMatchObject({
      beatIndex: 0,
      barIndex: 0,
      beatInBar: 0,
      stepIndex: 0,
      stepInBeat: 0,
      stepInBar: 0,
    });
    expect(
      getProgressionPositionFromTickIndex(1, {
        beatsPerBar: 4,
        beatUnit: 4,
      }),
    ).toBeUndefined();
  });
});
