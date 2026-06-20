"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ChordType } from "../lib/music";
import { migrateBeatRhythmToEvents } from "../lib/progression-migration";
import type {
  ChordProgression,
  ProgressionBar,
  ProgressionBeat,
  ProgressionBeatEventType,
  ProgressionCell,
  ProgressionDurationSteps,
  ProgressionRhythmEvent,
  TimeSignature,
} from "../lib/progression";

const storageKey = "muu-fret-degree:progression-settings";
const storageVersion = 8;

type PersistedProgressionSettings = {
  version: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

type LegacyProgressionBar = {
  bar: number;
  root: string;
  chordTypeId: string;
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

function isProgressionCell(value: unknown, roots: string[], chordTypes: ChordType[]): value is ProgressionCell {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.root === "string" &&
    roots.includes(value.root) &&
    typeof value.chordTypeId === "string" &&
    chordTypes.some((chordType) => chordType.id === value.chordTypeId)
  );
}

function isProgressionBar(
  value: unknown,
  roots: string[],
  chordTypes: ChordType[],
  allowLegacyBeatRhythm = false,
): value is ProgressionBar {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidBeats =
    value.beats === undefined ||
    (Array.isArray(value.beats) &&
      value.beats.length === 4 &&
      value.beats.every((beat) =>
        isProgressionBeat(beat, roots, chordTypes, allowLegacyBeatRhythm),
      ));
  const hasValidRhythm =
    value.rhythm === undefined ||
    (Array.isArray(value.rhythm) && value.rhythm.every(isProgressionRhythmEvent));

  return (
    isFiniteNumber(value.bar) &&
    Array.isArray(value.cells) &&
    value.cells.length === 2 &&
    isProgressionCell(value.cells[0], roots, chordTypes) &&
    isProgressionCell(value.cells[1], roots, chordTypes) &&
    hasValidBeats &&
    hasValidRhythm
  );
}

function isProgressionBeat(
  value: unknown,
  roots: string[],
  chordTypes: ChordType[],
  allowLegacyRhythm: boolean,
): value is ProgressionBeat {
  return (
    isRecord(value) &&
    (allowLegacyRhythm
      ? isProgressionDuration(value.durationSteps) && isProgressionEventType(value.eventType)
      : value.durationSteps === undefined && value.eventType === undefined) &&
    (value.chordOverride === undefined || isProgressionCell(value.chordOverride, roots, chordTypes))
  );
}

function isProgressionRhythmEvent(value: unknown): value is ProgressionRhythmEvent {
  return (
    isRecord(value) &&
    Number.isInteger(value.startStep) &&
    typeof value.startStep === "number" &&
    value.startStep >= 0 &&
    value.startStep < 16 &&
    isProgressionDuration(value.durationSteps) &&
    value.durationSteps !== undefined &&
    isProgressionEventType(value.eventType) &&
    value.eventType !== undefined
  );
}

function isProgressionDuration(value: unknown): value is ProgressionDurationSteps | undefined {
  return value === undefined || value === 1 || value === 2 || value === 3 || value === 4 || value === 6;
}

function isProgressionEventType(value: unknown): value is ProgressionBeatEventType | undefined {
  return value === undefined || value === "hit" || value === "rest" || value === "tie";
}

function isLegacyProgressionBar(value: unknown, roots: string[], chordTypes: ChordType[]): value is LegacyProgressionBar {
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
    if (!isRecord(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function migrateLegacyBars(bars: readonly LegacyProgressionBar[]): ProgressionBar[] {
  return bars.map((bar) => ({
    bar: bar.bar,
    cells: [
      { root: bar.root, chordTypeId: bar.chordTypeId },
      { root: bar.root, chordTypeId: bar.chordTypeId },
    ],
  }));
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
      storedSettings.version === storageVersion &&
      Array.isArray(storedSettings.bars) &&
      storedSettings.bars.every((bar) => isProgressionBar(bar, roots, chordTypes))
        ? storedSettings.bars
        : null;
    const compatibleBars =
      typeof storedSettings.version === "number" &&
      storedSettings.version >= 2 &&
      storedSettings.version <= 6 &&
      Array.isArray(storedSettings.bars) &&
      storedSettings.bars.every((bar) =>
        isProgressionBar(bar, roots, chordTypes, true),
      )
        ? storedSettings.bars
        : null;
    const versionSevenBars =
      storedSettings.version === 7 &&
      Array.isArray(storedSettings.bars) &&
      storedSettings.bars.every((bar) => isProgressionBar(bar, roots, chordTypes))
        ? storedSettings.bars
        : null;
    const legacyBars =
      storedSettings.version === 1 &&
      Array.isArray(storedSettings.bars) &&
      storedSettings.bars.every((bar) => isLegacyProgressionBar(bar, roots, chordTypes))
        ? storedSettings.bars
        : null;

    const currentBars =
      nextBars ??
      versionSevenBars ??
      (compatibleBars ? migrateBeatRhythmToEvents(compatibleBars) : null);

    if (isTimeSignature(storedSettings.timeSignature) && currentBars && currentBars.length > 0) {
      const timeSignature = storedSettings.timeSignature;

      setProgression((current) => ({
        ...current,
        timeSignature,
        bars: currentBars,
      }));
    } else if (isTimeSignature(storedSettings.timeSignature) && legacyBars && legacyBars.length > 0) {
      const timeSignature = storedSettings.timeSignature;

      setProgression((current) => ({
        ...current,
        timeSignature,
        bars: migrateLegacyBars(legacyBars),
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
