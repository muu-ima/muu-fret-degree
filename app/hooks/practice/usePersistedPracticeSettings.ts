"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ChordOctave, ChordType, FretRange, Tuning } from "../../lib/music";
import type { ArpeggioPattern } from "../audio/useChordPlayback";

const storageKey = "muu-fret-degree:practice-settings";
const storageVersion = 1;

type PersistedPracticeSettings = {
  version: number;
  root: string;
  chordTypeId: string;
  tuningId: string;
  fretRangeId: FretRange["id"];
  chordOctaveId: string;
  chordInversion: number;
  arpeggioPattern: ArpeggioPattern;
  showGuideTones: boolean;
  bpm: number;
};

type UsePersistedPracticeSettingsOptions = {
  values: {
    root: string;
    chordTypeId: string;
    tuningId: string;
    fretRangeId: FretRange["id"];
    chordOctaveId: string;
    chordInversion: number;
    arpeggioPattern: ArpeggioPattern;
    showGuideTones: boolean;
    bpm: number;
  };
  setters: {
    setRoot: Dispatch<SetStateAction<string>>;
    setChordTypeId: Dispatch<SetStateAction<string>>;
    setTuningId: Dispatch<SetStateAction<string>>;
    setFretRangeId: Dispatch<SetStateAction<FretRange["id"]>>;
    setChordOctaveId: Dispatch<SetStateAction<string>>;
    setChordInversion: Dispatch<SetStateAction<number>>;
    setArpeggioPattern: Dispatch<SetStateAction<ArpeggioPattern>>;
    setShowGuideTones: Dispatch<SetStateAction<boolean>>;
    commitBpm: (value: string) => void;
  };
  options: {
    roots: string[];
    chordTypes: ChordType[];
    tunings: Tuning[];
    fretRanges: readonly FretRange[];
    chordOctaves: readonly ChordOctave[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteBpm(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isArpeggioPattern(value: unknown): value is ArpeggioPattern {
  return (
    value === "root-only" ||
    value === "chord-order" ||
    value === "third-first" ||
    value === "lowest-per-degree"
  );
}

function isFretRangeId(value: unknown, fretRanges: readonly FretRange[]): value is FretRange["id"] {
  return typeof value === "string" && fretRanges.some((range) => range.id === value);
}

function readStoredSettings() {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue);
    if (!isRecord(parsed) || parsed.version !== storageVersion) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function usePersistedPracticeSettings({
  values,
  setters,
  options,
}: UsePersistedPracticeSettingsOptions) {
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);

  useEffect(() => {
    const storedSettings = readStoredSettings();
    if (!storedSettings) {
      setHasLoadedStoredSettings(true);
      return;
    }

    if (typeof storedSettings.root === "string" && options.roots.includes(storedSettings.root)) {
      setters.setRoot(storedSettings.root);
    }

    if (
      typeof storedSettings.chordTypeId === "string" &&
      options.chordTypes.some((chordType) => chordType.id === storedSettings.chordTypeId)
    ) {
      setters.setChordTypeId(storedSettings.chordTypeId);
    }

    if (
      typeof storedSettings.tuningId === "string" &&
      options.tunings.some((tuning) => tuning.id === storedSettings.tuningId)
    ) {
      setters.setTuningId(storedSettings.tuningId);
    }

    if (isFretRangeId(storedSettings.fretRangeId, options.fretRanges)) {
      setters.setFretRangeId(storedSettings.fretRangeId);
    }

    if (
      typeof storedSettings.chordOctaveId === "string" &&
      options.chordOctaves.some((octave) => octave.id === storedSettings.chordOctaveId)
    ) {
      setters.setChordOctaveId(storedSettings.chordOctaveId);
    }

    if (isFiniteNumber(storedSettings.chordInversion)) {
      setters.setChordInversion(Math.max(0, Math.round(storedSettings.chordInversion)));
    }

    if (isArpeggioPattern(storedSettings.arpeggioPattern)) {
      setters.setArpeggioPattern(storedSettings.arpeggioPattern);
    }

    if (typeof storedSettings.showGuideTones === "boolean") {
      setters.setShowGuideTones(storedSettings.showGuideTones);
    }

    if (isFiniteBpm(storedSettings.bpm)) {
      setters.commitBpm(String(storedSettings.bpm));
    }

    setHasLoadedStoredSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSettings) {
      return;
    }

    const nextSettings: PersistedPracticeSettings = {
      version: storageVersion,
      root: values.root,
      chordTypeId: values.chordTypeId,
      tuningId: values.tuningId,
      fretRangeId: values.fretRangeId,
      chordOctaveId: values.chordOctaveId,
      chordInversion: values.chordInversion,
      arpeggioPattern: values.arpeggioPattern,
      showGuideTones: values.showGuideTones,
      bpm: values.bpm,
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    } catch {
      // Storage can fail in private browsing or when quota is exceeded.
    }
  }, [
    hasLoadedStoredSettings,
    values.bpm,
    values.chordTypeId,
    values.chordInversion,
    values.arpeggioPattern,
    values.chordOctaveId,
    values.fretRangeId,
    values.root,
    values.showGuideTones,
    values.tuningId,
  ]);
}
