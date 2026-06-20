"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ChordType } from "../lib/music";
import {
  createPersistedProgressionSettings,
  parsePersistedProgressionSettings,
} from "../lib/progression-persistence";
import type { ChordProgression } from "../lib/progression/model";

const storageKey = "muu-fret-degree:progression-settings";

type UsePersistedProgressionOptions = {
  progression: ChordProgression;
  setProgression: Dispatch<SetStateAction<ChordProgression>>;
  roots: string[];
  chordTypes: ChordType[];
};

function readStoredSettings(roots: string[], chordTypes: ChordType[]) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue
      ? parsePersistedProgressionSettings(storedValue, roots, chordTypes)
      : null;
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
    const storedSettings = readStoredSettings(roots, chordTypes);
    if (storedSettings) {
      setProgression((current) => ({
        ...current,
        timeSignature: storedSettings.timeSignature,
        bars: storedSettings.bars,
      }));
    }

    setHasLoadedStoredSettings(true);
  }, [chordTypes, roots, setProgression]);

  useEffect(() => {
    if (!hasLoadedStoredSettings) {
      return;
    }

    const nextSettings = createPersistedProgressionSettings(
      progression.timeSignature,
      progression.bars,
    );

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    } catch {
      // Storage can fail in private browsing or when quota is exceeded.
    }
  }, [hasLoadedStoredSettings, progression.bars, progression.timeSignature]);
}
