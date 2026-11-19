import { describe, expect, it } from "vitest";
import { defaultMetronomeMix, getMetronomeMixClicks, mixerStepsPerBeat, type MetronomeMix } from "./metronome-mixer";

const silent: MetronomeMix = { accent: 0, quarter: 0, eighth: 0, sixteenth: 0, triplet: 0 };
const beat = (mix: MetronomeMix, beatIndex = 0) => Array.from({ length: mixerStepsPerBeat }, (_, step) => getMetronomeMixClicks(beatIndex, step, mix));

describe("metronome note mixer", () => {
  it.each([
    ["quarter", [0]], ["eighth", [6]], ["sixteenth", [3, 9]], ["triplet", [0, 4, 8]],
  ] as const)("places the %s rhythm on the common beat grid", (channel, expected) => {
    const clicks = beat({ ...silent, [channel]: 0.6 });
    expect(clicks.flatMap((events, step) => events.length ? [step] : [])).toEqual(expected);
    expect(clicks.flat()).toEqual(expected.map(() => ({ kind: "subdivision", volume: 0.6 })));
  });
  it("combines quarters and eighth offbeats into two equal eighth notes per beat", () => {
    for (let index = 0; index < 4; index++) {
      const clicks = beat({ ...silent, quarter: 0.6, eighth: 0.6 }, index);
      expect(clicks.flatMap((events, step) => events.length ? [step] : [])).toEqual([0, 6]);
      expect(clicks.flat()).toEqual(Array(2).fill({ kind: "subdivision", volume: 0.6 }));
    }
  });
  it("adds sixteenth offbeats without doubling the head or eighth offbeat", () => {
    const clicks = beat({ ...silent, quarter: 0.2, eighth: 0.4, sixteenth: 0.6 });
    expect(clicks.flatMap((events, step) => events.length ? [step] : [])).toEqual([0, 3, 6, 9]);
    expect(clicks.flat().map((click) => click.volume)).toEqual([0.2, 0.6, 0.4, 0.6]);
  });
  it("mixes triplets and sixteenths without shifting either rhythm", () => {
    const clicks = beat({ ...silent, triplet: 0.3, sixteenth: 0.4 });
    expect(clicks.flatMap((events, step) => events.length ? [step] : [])).toEqual([0, 3, 4, 8, 9]);
    expect(clicks[0]).toEqual([{ kind: "subdivision", volume: 0.3 }]);
    expect(clicks[4]).toEqual([{ kind: "subdivision", volume: 0.3 }]);
  });
  it("caps coincident rhythm levels and keeps the accent on the measure head only", () => {
    const mix = { accent: 0.5, quarter: 1, eighth: 1, sixteenth: 1, triplet: 1 };
    expect(beat(mix)[0]).toEqual([{ kind: "subdivision", volume: 1 }, { kind: "accent", volume: 0.5 }]);
    for (let index = 1; index < 6; index++) {
      expect(beat(mix, index).flat().some((click) => click.kind === "accent")).toBe(false);
    }
  });
  it("silences zero channels and plays uniform quarters by default", () => {
    expect(beat(silent).flat()).toEqual([]);
    for (let index = 0; index < 4; index++) {
      expect(beat(defaultMetronomeMix, index).flat()).toEqual([{ kind: "subdivision", volume: 1 }]);
    }
  });
  it("allows an accent alone and clamps invalid channel values", () => {
    expect(beat({ ...silent, accent: 0.4 }).flat()).toEqual([{ kind: "accent", volume: 0.4 }]);
    expect(beat({ ...silent, quarter: Infinity, eighth: -1 }).flat()).toEqual([]);
    expect(beat({ ...silent, quarter: 2 })[0]).toEqual([{ kind: "subdivision", volume: 1 }]);
  });
});
