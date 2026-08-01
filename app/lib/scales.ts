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

export type ScaleFingering = readonly string[];

export type DiatonicModeRow = {
  chordQuality: string;
  degree: string;
  roman: string;
  root: string;
  scale: ScaleDefinition;
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
  {
    id: "phrygian",
    name: "Phrygian Scale",
    shortName: "Phrygian",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "b2", semitones: 1 },
      { degree: "b3", semitones: 3 },
      { degree: "4", semitones: 5 },
      { degree: "5", semitones: 7 },
      { degree: "b6", semitones: 8 },
      { degree: "b7", semitones: 10 },
      { degree: "8", semitones: 12 },
    ],
  },
  {
    id: "lydian",
    name: "Lydian Scale",
    shortName: "Lydian",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "2", semitones: 2 },
      { degree: "3", semitones: 4 },
      { degree: "#4", semitones: 6 },
      { degree: "5", semitones: 7 },
      { degree: "6", semitones: 9 },
      { degree: "7", semitones: 11 },
      { degree: "8", semitones: 12 },
    ],
  },
  {
    id: "mixolydian",
    name: "Mixolydian Scale",
    shortName: "Mixolydian",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "2", semitones: 2 },
      { degree: "3", semitones: 4 },
      { degree: "4", semitones: 5 },
      { degree: "5", semitones: 7 },
      { degree: "6", semitones: 9 },
      { degree: "b7", semitones: 10 },
      { degree: "8", semitones: 12 },
    ],
  },
  {
    id: "natural-minor",
    name: "Aeolian Scale",
    shortName: "Aeolian",
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
    id: "locrian",
    name: "Locrian Scale",
    shortName: "Locrian",
    intervals: [
      { degree: "1", semitones: 0 },
      { degree: "b2", semitones: 1 },
      { degree: "b3", semitones: 3 },
      { degree: "4", semitones: 5 },
      { degree: "b5", semitones: 6 },
      { degree: "b6", semitones: 8 },
      { degree: "b7", semitones: 10 },
      { degree: "8", semitones: 12 },
    ],
  },
] as const satisfies readonly ScaleDefinition[];

export type ScaleId = (typeof scaleDefinitions)[number]["id"];

export const defaultScaleId = "major" satisfies ScaleId;

export const scaleFingerings: Partial<Record<ScaleId, Partial<Record<string, ScaleFingering>>>> = {
  major: {
    C: ["1", "1", "3", "4", "1", "1", "3", "4", "1", "3", "4", "1", "1", "3", "4"],
  },
};

export function findScaleDefinition(scaleId: string) {
  return scaleDefinitions.find((scale) => scale.id === scaleId) ?? scaleDefinitions[0];
}

export function findScaleFingering(scaleId: ScaleId, root: string) {
  return scaleFingerings[scaleId]?.[root] ?? scaleFingerings[scaleId]?.default;
}

const diatonicModeScaleIds = ["major", "dorian", "phrygian", "lydian", "mixolydian", "natural-minor", "locrian"] as const satisfies readonly ScaleId[];
const diatonicModeRoles = [
  { chordQuality: "maj7", degree: "1", roman: "I" },
  { chordQuality: "m7", degree: "2", roman: "ii" },
  { chordQuality: "m7", degree: "3", roman: "iii" },
  { chordQuality: "maj7", degree: "4", roman: "IV" },
  { chordQuality: "7", degree: "5", roman: "V" },
  { chordQuality: "m7", degree: "6", roman: "vi" },
  { chordQuality: "m7b5", degree: "7", roman: "viiø" },
] as const;
const bassScaleFloorMidi = 40;

export function modeSheetLabel(scale: ScaleDefinition) {
  if (scale.id === "major") {
    return "Ionian";
  }

  if (scale.id === "natural-minor") {
    return "Aeolian";
  }

  return scale.shortName;
}

export function makeDiatonicModeRows(keyRoot: string): DiatonicModeRow[] {
  const parentScale = findScaleDefinition("major");
  const parentScaleNotes = makeScaleNotes(keyRoot, parentScale);

  return diatonicModeScaleIds.map((scaleId, index) => ({
    chordQuality: diatonicModeRoles[index].chordQuality,
    degree: diatonicModeRoles[index].degree,
    roman: diatonicModeRoles[index].roman,
    root: parentScaleNotes[index].note,
    scale: findScaleDefinition(scaleId),
  }));
}

function scaleRootMidi(root: string, baseMidi: number) {
  const rootPitchIndex = sharpPitchClasses.indexOf(pitchClassOf(root));
  const octaveOffset = rootPitchIndex >= sharpPitchClasses.indexOf("D#") ? -12 : 0;
  const rootMidi = baseMidi + rootPitchIndex + octaveOffset;

  return rootMidi < bassScaleFloorMidi ? rootMidi + 12 : rootMidi;
}

export function makeScaleNotes(root: string, scale: ScaleDefinition, baseMidi = 48): ScaleNote[] {
  const rootMidi = scaleRootMidi(root, baseMidi);

  return scale.intervals.map((interval) => ({
    degree: interval.degree,
    midi: rootMidi + interval.semitones,
    note: spellIntervalNote(root, interval),
  }));
}

function makeExtendedScaleDegree(degree: string) {
  const normalizedDegree = degree.replace("b", "").replace("#", "");
  const degreeNumber = Number(normalizedDegree);

  if (!Number.isFinite(degreeNumber)) {
    return degree;
  }

  return degree.replace(normalizedDegree, String(degreeNumber + 7));
}

export function makeTwoOctaveScaleNotes(root: string, scale: ScaleDefinition, baseMidi = 48): ScaleNote[] {
  const firstOctaveNotes = makeScaleNotes(root, scale, baseMidi);
  const secondOctaveNotes = firstOctaveNotes.slice(1).map((note) => ({
    degree: makeExtendedScaleDegree(note.degree),
    midi: note.midi + 12,
    note: note.note,
  }));

  return [...firstOctaveNotes, ...secondOctaveNotes];
}
