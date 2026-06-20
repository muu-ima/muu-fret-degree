export type TimeSignature = {
  beatsPerBar: number;
  beatUnit: number;
};

export type ProgressionCell = {
  root: string;
  chordTypeId: string;
};

export type ProgressionBeatEventType = "hit" | "rest" | "tie";
export type ProgressionDurationSteps = 1 | 2 | 3 | 4 | 6;
export type ProgressionSubdivision = "eighths" | "sixteenths";

export type ProgressionBeat = {
  chordOverride?: ProgressionCell;
};

export type ProgressionRhythmEvent = {
  startStep: number;
  durationSteps: ProgressionDurationSteps;
  eventType: ProgressionBeatEventType;
};

export type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
  beats?: readonly [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
  rhythm?: readonly ProgressionRhythmEvent[];
};

export type ChordProgression = {
  bpm: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

export type ProgressionPosition = {
  elapsedSeconds: number;
  beatIndex: number;
  barIndex: number;
  beatInBar: number;
  stepIndex: number;
  stepInBeat: number;
  stepInBar: number;
};

export type ProgressionSelection = {
  bar: ProgressionBar;
  cell: ProgressionCell;
  cellIndex: number;
};

export type ProgressionPlaybackState = {
  position: ProgressionPosition;
  selection?: ProgressionSelection;
};

export const progressionStepsPerBeat = 4;

export function makeProgressionBar(
  bar: number,
  firstCell: ProgressionCell,
  secondCell: ProgressionCell = firstCell,
): ProgressionBar {
  return {
    bar,
    cells: [{ ...firstCell }, { ...secondCell }],
  };
}

export function createDefaultProgression(bpm = 120): ChordProgression {
  return {
    bpm,
    timeSignature: { beatsPerBar: 4, beatUnit: 4 },
    bars: [
      makeProgressionBar(1, { root: "C", chordTypeId: "maj7" }),
      makeProgressionBar(2, { root: "A", chordTypeId: "m7" }),
      makeProgressionBar(3, { root: "D", chordTypeId: "m7" }),
      makeProgressionBar(4, { root: "G", chordTypeId: "7" }),
    ],
  };
}
