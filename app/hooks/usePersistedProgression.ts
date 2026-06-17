"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ChordType } from "../lib/music";
import type { ChordProgression, ProgressionBar, TimeSignature } from "../lib/progression";

const storageKey = "muu-fret-degree:progression-settings";
const storageVersion = 1;

type PersistedProgressionSettings = {
  version: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

type UsePersistedProgressionOptions = {
  progression: ChordProgression;
  setProgression: Dispatch<SetStateAction<ChordProgression>>;
  roots: string[];
  chordTypes: ChordType[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isProgressionBar(value: unknown, roots: string[], chordTypes: ChordType[]): value is ProgressionBar {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.bar) &&
    typeof value.root === "string" &&
    roots.includes(value.root) &&
    typeof value.chordTypeId === "string" &&
    chordTypes.some((chordType) => chordType.id === value.chordTypeId)
  );
}

function isTimeSignature(value: unknown): value is TimeSignature {
  return (
    isRecord(value) &&
    isFiniteNumber(value.beatsPerBar) &&
    isFiniteNumber(value.beatUnit) &&
    value.beatsPerBar > 0 &&
    value.beatUnit > 0
  );
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

export function usePersistedProgression({
  progression,
  setProgression,
  roots,
  chordTypes,
}: UsePersistedProgressionOptions) {
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);

  useEffect(() => {
    const storedSettings = readStoredSettings();
    if (!storedSettings) {
      setHasLoadedStoredSettings(true);
      return;
    }

    const nextBars =
      Array.isArray(storedSettings.bars) && storedSettings.bars.every((bar) => isProgressionBar(bar, roots, chordTypes))
        ? storedSettings.bars
        : null;

    if (isTimeSignature(storedSettings.timeSignature) && nextBars && nextBars.length > 0) {
      const timeSignature = storedSettings.timeSignature;

      setProgression((current) => ({
        ...current,
        timeSignature,
        bars: nextBars,
      }));
    }

    setHasLoadedStoredSettings(true);
  }, [chordTypes, roots, setProgression]);

  useEffect(() => {
    if (!hasLoadedStoredSettings) {
      return;
    }

    const nextSettings: PersistedProgressionSettings = {
      version: storageVersion,
      timeSignature: progression.timeSignature,
      bars: progression.bars,
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    } catch {
      // Storage can fail in private browsing or when quota is exceeded.
    }
  }, [hasLoadedStoredSettings, progression.bars, progression.timeSignature]);
}
