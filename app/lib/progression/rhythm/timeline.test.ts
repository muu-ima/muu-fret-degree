import { describe, expect, it } from "vitest";
import { createDefaultProgression, type ChordProgression } from "../model";
import { updateProgressionBeatDuration } from "./commands";
import {
  createProgressionVirtualTimeline,
  progressionStepsPerBar,
  progressionVirtualLoopCount,
  validateProgressionRhythmPlacement,
} from "./timeline";

describe("progression virtual rhythm timeline", () => {
  it("expands the saved bars into exactly two calculation-only loops", () => {
    const progression = createDefaultProgression();
    const timeline = createProgressionVirtualTimeline(progression);

    expect(timeline.stepsPerLoop).toBe(progression.bars.length * progressionStepsPerBar);
    expect(timeline.totalSteps).toBe(timeline.stepsPerLoop * progressionVirtualLoopCount);
    expect(timeline.events).toHaveLength(progression.bars.length * 4 * 2);
    expect(timeline.events[0]).toMatchObject({
      absoluteStartStep: 0,
      barIndex: 0,
      loopIndex: 0,
    });
    expect(timeline.events.at(-1)).toMatchObject({
      absoluteStartStep: timeline.totalSteps - 4,
      barIndex: progression.bars.length - 1,
      loopIndex: 1,
    });
  });

  it("lets an earlier event own its full range", () => {
    const progression: ChordProgression = {
      bpm: 120,
      timeSignature: { beatsPerBar: 4, beatUnit: 4 },
      bars: [{
        bar: 1,
        cells: [
          { root: "C", chordTypeId: "maj7" },
          { root: "C", chordTypeId: "maj7" },
        ],
        rhythm: [
          { startStep: 0, durationSteps: 4, eventType: "hit" },
          { startStep: 2, durationSteps: 1, eventType: "rest" },
        ],
      }],
    };

    const timeline = createProgressionVirtualTimeline(progression);

    expect(timeline.events.some((event) => event.absoluteStartStep === 2)).toBe(false);
    expect(timeline.events.some((event) => event.absoluteStartStep === 18)).toBe(false);
  });

  it("detects final-bar occupation at the start of the virtual second loop", () => {
    const initial = createDefaultProgression();
    const lastBarIndex = initial.bars.length - 1;
    const progression = updateProgressionBeatDuration(initial, lastBarIndex, 3, 6);
    const timeline = createProgressionVirtualTimeline(progression);
    const crossingEvent = timeline.events.find(
      (event) => event.absoluteStartStep === timeline.stepsPerLoop - 4,
    );

    expect(crossingEvent?.absoluteEndStep).toBe(timeline.stepsPerLoop + 2);
    expect(timeline.events.some((event) => event.absoluteStartStep === timeline.stepsPerLoop)).toBe(
      false,
    );
    expect(validateProgressionRhythmPlacement(timeline, timeline.stepsPerLoop, 1)).toMatchObject({
      canPlace: false,
      conflictingEvent: crossingEvent,
      reason: "occupied-by-prior-event",
    });
  });

  it("returns a distinct reason when a new duration reaches a following event", () => {
    const timeline = createProgressionVirtualTimeline(createDefaultProgression());

    expect(validateProgressionRhythmPlacement(timeline, 0, 6)).toMatchObject({
      canPlace: false,
      reason: "overlaps-following-event",
    });
    expect(validateProgressionRhythmPlacement(timeline, timeline.totalSteps, 1)).toEqual({
      canPlace: false,
      reason: "outside-timeline",
    });
  });

  it("does not add virtual bars to the saved progression", () => {
    const progression = createDefaultProgression();
    const savedBars = progression.bars;

    createProgressionVirtualTimeline(progression);

    expect(progression.bars).toBe(savedBars);
    expect(progression.bars).toHaveLength(4);
  });
});
