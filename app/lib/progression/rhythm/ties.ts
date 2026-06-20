import type { ChordProgression, ProgressionBar } from "../model";
import { getProgressionBeatEventType } from "./queries";

export function canTieProgressionBeat(
  bars: readonly ProgressionBar[],
  barIndex: number,
  beatIndex: number,
) {
  if (!bars[barIndex] || beatIndex < 0 || beatIndex > 3) {
    return false;
  }

  const totalBeats = bars.length * 4;
  for (let offset = 1; offset < totalBeats; offset += 1) {
    const previousLocation = getRelativeBeatLocation(bars, barIndex, beatIndex, -offset);
    if (!previousLocation) {
      return false;
    }

    const previousEventType = getProgressionBeatEventType(
      bars[previousLocation.barIndex],
      previousLocation.beatIndex,
    );
    if (previousEventType === "hit") {
      return true;
    }
    if (previousEventType === "rest") {
      return false;
    }
  }

  return false;
}

export function countFollowingProgressionTies(
  progression: ChordProgression,
  barIndex: number,
  beatIndex: number,
) {
  if (progression.bars.length === 0 || beatIndex < 0 || beatIndex > 3) {
    return 0;
  }

  const beatsPerBar = Math.min(
    4,
    Math.max(1, Math.floor(progression.timeSignature.beatsPerBar)),
  );
  const totalBeats = progression.bars.length * beatsPerBar;
  const startBeat = barIndex * beatsPerBar + beatIndex;
  let tieCount = 0;

  for (let offset = 1; offset < totalBeats; offset += 1) {
    const absoluteBeat = startBeat + offset;
    const nextBarIndex = Math.floor(absoluteBeat / beatsPerBar) % progression.bars.length;
    const nextBeatIndex = absoluteBeat % beatsPerBar;

    if (getProgressionBeatEventType(progression.bars[nextBarIndex], nextBeatIndex) !== "tie") {
      break;
    }

    tieCount += 1;
  }

  return tieCount;
}

export function getRelativeBeatLocation(
  bars: readonly ProgressionBar[],
  barIndex: number,
  beatIndex: number,
  offset: number,
) {
  if (bars.length === 0) {
    return undefined;
  }

  const totalBeats = bars.length * 4;
  const startBeat = barIndex * 4 + beatIndex;
  const relativeBeat = ((startBeat + offset) % totalBeats + totalBeats) % totalBeats;

  return {
    barIndex: Math.floor(relativeBeat / 4),
    beatIndex: relativeBeat % 4,
  };
}
