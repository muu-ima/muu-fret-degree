import { pitchClassOf, sharpPitchClasses, spellIntervalNote, type Interval } from "./music";

export type ScaleDefinition = {
  id: string;
  name: string;
  shortName: string;
  intervals: Interval[];
};

export type ScaleNote = {
  degree: string;
  midi: number;
  note: string;
};

export const scaleDefinitions = [
  {
    id: "major",
    name: "Major Scale",
    shortName: "Major",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "2", semitones: 2 },
      { degree: "3", semitones: 4 },
      { degree: "4", semitones: 5 },
      { degree: "5", semitones: 7 },
      { degree: "6", semitones: 9 },
      { degree: "7", semitones: 11 },
      { degree: "8", semitones: 12 },
    ],
  },
  {
    id: "natural-minor",
    name: "Natural Minor Scale",
    shortName: "Natural Minor",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "2", semitones: 2 },
      { degree: "b3", semitones: 3 },
      { degree: "4", semitones: 5 },
      { degree: "5", semitones: 7 },
      { degree: "b6", semitones: 8 },
      { degree: "b7", semitones: 10 },
      { degree: "8", semitones: 12 },
    ],
  },
  {
    id: "dorian",
    name: "Dorian Scale",
    shortName: "Dorian",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "2", semitones: 2 },
      { degree: "b3", semitones: 3 },
      { degree: "4", semitones: 5 },
      { degree: "5", semitones: 7 },
      { degree: "6", semitones: 9 },
      { degree: "b7", semitones: 10 },
      { degree: "8", semitones: 12 },
    ],
  },
] as const satisfies readonly ScaleDefinition[];

export type ScaleId = (typeof scaleDefinitions)[number]["id"];

export const defaultScaleId = "major" satisfies ScaleId;

export function findScaleDefinition(scaleId: string) {
  return scaleDefinitions.find((scale) => scale.id === scaleId) ?? scaleDefinitions[0];
}

function scaleRootMidi(root: string, baseMidi: number) {
  const rootPitchIndex = sharpPitchClasses.indexOf(pitchClassOf(root));
  const octaveOffset = rootPitchIndex >= sharpPitchClasses.indexOf("D#") ? -12 : 0;

  return baseMidi + rootPitchIndex + octaveOffset;
}

export function makeScaleNotes(root: string, scale: ScaleDefinition, baseMidi = 48): ScaleNote[] {
  const rootMidi = scaleRootMidi(root, baseMidi);

  return scale.intervals.map((interval) => ({
    degree: interval.degree,
    midi: rootMidi + interval.semitones,
    note: spellIntervalNote(root, interval),
  }));
}
