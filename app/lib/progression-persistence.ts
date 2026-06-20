import type { ChordType } from "./music";
import {
  migrateBeatRhythmToEvents,
  migrateLegacyBars,
  type LegacyProgressionBar,
} from "./progression-migration";
import type {
  ProgressionBar,
  ProgressionBeat,
  ProgressionBeatEventType,
  ProgressionCell,
  ProgressionDurationSteps,
  ProgressionRhythmEvent,
  TimeSignature,
} from "./progression/model";

export const progressionStorageVersion = 8;

export type PersistedProgressionSettings = {
  version: number;
  timeSignature: TimeSignature;
  bars: readonly ProgressionBar[];
};

export type HydratedProgressionSettings = Pick<
  PersistedProgressionSettings,
  "timeSignature" | "bars"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isProgressionCell(
  value: unknown,
  roots: string[],
  chordTypes: ChordType[],
): value is ProgressionCell {
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
    (value.chordOverride === undefined ||
      isProgressionCell(value.chordOverride, roots, chordTypes))
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

function isLegacyProgressionBar(
  value: unknown,
  roots: string[],
  chordTypes: ChordType[],
): value is LegacyProgressionBar {
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

export function decodePersistedProgressionSettings(
  value: unknown,
  roots: string[],
  chordTypes: ChordType[],
): HydratedProgressionSettings | null {
  if (!isRecord(value) || !isTimeSignature(value.timeSignature)) {
    return null;
  }

  const currentBars =
    (value.version === progressionStorageVersion || value.version === 7) &&
    Array.isArray(value.bars) &&
    value.bars.every((bar) => isProgressionBar(bar, roots, chordTypes))
      ? value.bars
      : null;
  const compatibleBars =
    typeof value.version === "number" &&
    value.version >= 2 &&
    value.version <= 6 &&
    Array.isArray(value.bars) &&
    value.bars.every((bar) => isProgressionBar(bar, roots, chordTypes, true))
      ? migrateBeatRhythmToEvents(value.bars)
      : null;
  const legacyBars =
    value.version === 1 &&
    Array.isArray(value.bars) &&
    value.bars.every((bar) => isLegacyProgressionBar(bar, roots, chordTypes))
      ? migrateLegacyBars(value.bars)
      : null;
  const bars = currentBars ?? compatibleBars ?? legacyBars;

  return bars && bars.length > 0
    ? { timeSignature: value.timeSignature, bars }
    : null;
}

export function parsePersistedProgressionSettings(
  serialized: string,
  roots: string[],
  chordTypes: ChordType[],
) {
  try {
    return decodePersistedProgressionSettings(JSON.parse(serialized), roots, chordTypes);
  } catch {
    return null;
  }
}

export function createPersistedProgressionSettings(
  timeSignature: TimeSignature,
  bars: readonly ProgressionBar[],
): PersistedProgressionSettings {
  return {
    version: progressionStorageVersion,
    timeSignature,
    bars,
  };
}
