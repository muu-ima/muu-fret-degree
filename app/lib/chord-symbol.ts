import type { ChordType } from "./music";

const chordTypeSymbols: Record<string, string> = {
  maj: "Maj",
  min: "m",
  dim: "dim",
  aug: "aug",
  maj7: "maj7",
  "7": "7",
  m7: "m7",
  m7b5: "m7b5",
  dim7: "dim7",
  sus4: "sus4",
  "6": "6",
  m6: "m6",
};

export function formatChordTypeSymbol(chordTypeId: string, chordTypes: ChordType[]) {
  return chordTypeSymbols[chordTypeId] ?? chordTypes.find((item) => item.id === chordTypeId)?.name ?? chordTypeId;
}

export function formatChordSymbol(root: string, chordTypeId: string, chordTypes: ChordType[]) {
  const suffix = chordTypeSymbols[chordTypeId];
  if (suffix === "Maj") {
    return root;
  }
  return `${root}${suffix ?? ` ${chordTypes.find((item) => item.id === chordTypeId)?.name ?? chordTypeId}`}`;
}
