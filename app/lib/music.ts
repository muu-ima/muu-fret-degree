export type Interval = {
  degree: string;
  semitones: number;
};

export type ChordType = {
  id: string;
  name: string;
  intervals: Interval[];
};

export type BassString = {
  name: string;
  note: string;
  midi: number;
};

export type Tuning = {
  id: string;
  name: string;
  strings: BassString[];
};

export type FretNote = {
  id: string;
  stringIndex: number;
  fret: number;
  midi: number;
  pitchClass: string;
  note: string;
  degree?: string;
  inChord: boolean;
};

export type ChordNote = Interval & {
  note: string;
};

export type ChordOctave = {
  id: string;
  label: string;
  midi: number;
};

export const maxFret = 22;

export const chordOctaves = [
  { id: "C3", label: "C3", midi: 48 },
  { id: "C4", label: "C4", midi: 60 },
  { id: "C5", label: "C5", midi: 72 },
] as const satisfies readonly ChordOctave[];

export const fretRanges = [
  { id: "low", label: "0-12F", start: 0, end: 12 },
  { id: "high", label: "13-22F", start: 13, end: 22 },
] as const;

export type FretRange = (typeof fretRanges)[number];

export const markerFrets = new Set([3, 5, 7, 9, 15, 17, 19, 21]);

export const degreeTone: Record<string, string> = {
  "1": "#e84d5b",
  "b3": "#2b7de9",
  "3": "#2b7de9",
  "4": "#16a085",
  "5": "#f2a51a",
  "b5": "#8f5bd5",
  "#5": "#8f5bd5",
  "6": "#0f9d7a",
  "7": "#b4478f",
  "b7": "#b4478f",
  "bb7": "#6e5a46",
};

export const sharpPitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flatPitchClasses = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const letterOrder = ["C", "D", "E", "F", "G", "A", "B"];

const degreeLetterSteps: Record<string, number> = {
  "1": 0,
  "b2": 1,
  "2": 1,
  "#2": 1,
  "bb3": 2,
  "b3": 2,
  "3": 2,
  "4": 3,
  "#4": 3,
  "b5": 4,
  "5": 4,
  "#5": 4,
  "b6": 5,
  "6": 5,
  "bb7": 6,
  "b7": 6,
  "7": 6,
};

export function noteAt(chromatic: string[], midi: number) {
  return chromatic[((midi % 12) + 12) % 12];
}

export function pitchClassAt(midi: number) {
  return sharpPitchClasses[((midi % 12) + 12) % 12];
}

export function pitchClassOf(note: string) {
  const sharpIndex = sharpPitchClasses.indexOf(note);
  if (sharpIndex >= 0) {
    return sharpPitchClasses[sharpIndex];
  }

  const flatIndex = flatPitchClasses.indexOf(note);
  if (flatIndex >= 0) {
    return sharpPitchClasses[flatIndex];
  }

  return note;
}

function naturalPitchClass(letter: string) {
  return sharpPitchClasses.indexOf(letter);
}

function normalizeAccidental(offset: number) {
  if (offset > 6) {
    return offset - 12;
  }
  if (offset < -6) {
    return offset + 12;
  }
  return offset;
}

export function spellIntervalNote(root: string, interval: Interval) {
  const rootLetter = root[0];
  const rootLetterIndex = letterOrder.indexOf(rootLetter);
  const degreeStep = degreeLetterSteps[interval.degree] ?? 0;
  const targetLetter = letterOrder[(rootLetterIndex + degreeStep) % letterOrder.length];
  const rootPitchClass = sharpPitchClasses.indexOf(pitchClassOf(root));
  const targetPitchClass = (rootPitchClass + interval.semitones) % sharpPitchClasses.length;
  const accidental = normalizeAccidental(targetPitchClass - naturalPitchClass(targetLetter));

  if (accidental === 0) {
    return targetLetter;
  }
  if (accidental > 0) {
    return targetLetter + "#".repeat(accidental);
  }
  return targetLetter + "b".repeat(Math.abs(accidental));
}

export function frequencyFromMidi(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function makeChordMap(root: string, chordType: ChordType, chromatic: string[]) {
  const rootIndex = sharpPitchClasses.indexOf(pitchClassOf(root));
  return new Map(
    chordType.intervals.map((interval) => {
      const pitchClass = sharpPitchClasses[(rootIndex + interval.semitones) % chromatic.length];
      return [
        pitchClass,
        {
          degree: interval.degree,
          note: spellIntervalNote(root, interval),
        },
      ];
    }),
  );
}

export function makeFretNotes(tuning: Tuning, chordMap: ReturnType<typeof makeChordMap>, chromatic: string[]) {
  return tuning.strings.flatMap((string, stringIndex) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => {
      const midi = string.midi + fret;
      const pitchClass = pitchClassAt(midi);
      const chordTone = chordMap.get(pitchClass);
      return {
        id: `${stringIndex}-${fret}`,
        stringIndex,
        fret,
        midi,
        pitchClass,
        note: chordTone?.note ?? noteAt(chromatic, midi),
        degree: chordTone?.degree,
        inChord: Boolean(chordTone),
      };
    }),
  );
}

export function makeChordNotes(root: string, chordType: ChordType): ChordNote[] {
  return chordType.intervals.map((interval) => ({
    ...interval,
    note: spellIntervalNote(root, interval),
  }));
}

export function pickLowestBassNoteForDegree(notes: FretNote[], degree: string, maxFret = 7) {
  return notes
    .filter((note) => note.degree === degree && note.fret <= maxFret)
    .sort((a, b) => a.midi - b.midi)[0];
}

export function chordInversionLabel(inversion: number) {
  if (inversion === 0) {
    return "Root";
  }
  if (inversion === 1) {
    return "1st Inv";
  }
  if (inversion === 2) {
    return "2nd Inv";
  }
  if (inversion === 3) {
    return "3rd Inv";
  }
  return `${inversion}th Inv`;
}

export function makeTrebleChordMidi(root: string, chordType: ChordType, baseMidi = 60, inversion = 0) {
  const rootMidi = baseMidi + sharpPitchClasses.indexOf(pitchClassOf(root));
  const chordMidi = chordType.intervals.map((interval) => rootMidi + interval.semitones);
  const normalizedInversion = Math.min(Math.max(Math.round(inversion), 0), Math.max(chordMidi.length - 1, 0));

  return [
    ...chordMidi.slice(normalizedInversion),
    ...chordMidi.slice(0, normalizedInversion).map((midi) => midi + 12),
  ];
}
