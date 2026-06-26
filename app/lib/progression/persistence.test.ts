import { describe, expect, it } from "vitest";
import type { ChordType } from "../music";
import {
  createPersistedProgressionSettings,
  decodePersistedProgressionSettings,
  parsePersistedProgressionSettings,
  progressionStorageVersion,
} from "./persistence";

const roots = ["C", "G"];
const chordTypes: ChordType[] = [
  { id: "maj7", name: "Major 7", intervals: [] },
  { id: "7", name: "Dominant 7", intervals: [] },
];
const timeSignature = { beatsPerBar: 4, beatUnit: 4 };
const cells = [
  { root: "C", chordTypeId: "maj7" },
  { root: "G", chordTypeId: "7" },
] as const;

describe("progression persistence", () => {
  it("accepts the current storage format", () => {
    const stored = {
      version: progressionStorageVersion,
      timeSignature,
      bars: [{
        bar: 1,
        cells,
        rhythm: [{ startStep: 2, durationSteps: 2, eventType: "hit" }],
        tickRhythm: [{ startTick: 6, durationTicks: 6, eventType: "hit" }],
      }],
    };

    expect(decodePersistedProgressionSettings(stored, roots, chordTypes)).toEqual({
      timeSignature,
      bars: stored.bars,
    });
  });

  it("migrates legacy beat rhythm from versions two through six", () => {
    const stored = {
      version: 4,
      timeSignature,
      bars: [{
        bar: 1,
        cells,
        beats: [
          { durationSteps: 3, eventType: "rest" },
          {},
          {},
          {},
        ],
      }],
    };

    expect(decodePersistedProgressionSettings(stored, roots, chordTypes)?.bars[0]).toEqual({
      bar: 1,
      cells: [...cells],
      rhythm: [{ startStep: 0, durationSteps: 3, eventType: "rest" }],
    });
  });

  it("migrates version one bars into two-cell harmony", () => {
    const stored = {
      version: 1,
      timeSignature,
      bars: [{ bar: 1, root: "C", chordTypeId: "maj7" }],
    };

    expect(decodePersistedProgressionSettings(stored, roots, chordTypes)?.bars[0].cells).toEqual([
      { root: "C", chordTypeId: "maj7" },
      { root: "C", chordTypeId: "maj7" },
    ]);
  });

  it("rejects malformed JSON and unsupported versions", () => {
    expect(parsePersistedProgressionSettings("not json", roots, chordTypes)).toBeNull();
    expect(decodePersistedProgressionSettings({
      version: 10,
      timeSignature,
      bars: [{ bar: 1, cells }],
    }, roots, chordTypes)).toBeNull();
  });

  it("writes the current storage version", () => {
    expect(createPersistedProgressionSettings(timeSignature, [{ bar: 1, cells }])).toEqual({
      version: 9,
      timeSignature,
      bars: [{ bar: 1, cells }],
    });
  });

  it("adds tick rhythm when saving explicit step rhythm", () => {
    expect(createPersistedProgressionSettings(timeSignature, [{
      bar: 1,
      cells,
      rhythm: [{ startStep: 2, durationSteps: 2, eventType: "hit" }],
    }])).toEqual({
      version: 9,
      timeSignature,
      bars: [{
        bar: 1,
        cells,
        rhythm: [{ startStep: 2, durationSteps: 2, eventType: "hit" }],
        tickRhythm: [{ startTick: 6, durationTicks: 6, eventType: "hit" }],
      }],
    });
  });
});
