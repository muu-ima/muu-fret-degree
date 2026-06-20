"use client";

import { useCallback } from "react";
import {
  countFollowingProgressionTies,
  getProgressionBeatEventType,
  getProgressionCellForBeat,
  isProgressionBeatStart,
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionPosition,
} from "../lib/progression";
import type { ProgressionRhythm } from "../lib/progression-playback";
import { useProgressionStepScheduler } from "./useProgressionStepScheduler";

type UseProgressionBeatSchedulerOptions = {
  isRunning: boolean;
  playBeat: (options: {
    beatInBar: number;
    beatEventType?: ProgressionBeatEventType;
    followingTieBeats?: number;
    rhythm: ProgressionRhythm;
    nextRoot?: string;
  }) => void;
  position: ProgressionPosition;
  progression: ChordProgression;
  rhythm: ProgressionRhythm;
};

export function useProgressionBeatScheduler({
  isRunning,
  playBeat,
  position,
  progression,
  rhythm,
}: UseProgressionBeatSchedulerOptions) {
  const bars = progression.bars;

  const scheduleBeat = useCallback((stepPosition: ProgressionPosition) => {
    if (!isProgressionBeatStart(stepPosition) || bars.length === 0) {
      return;
    }

    const currentBarIndex = stepPosition.barIndex % bars.length;
    const currentBar = bars[currentBarIndex];
    const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
    const nextBeatInBar = (stepPosition.beatInBar + 1) % beatsPerBar;
    const nextBarIndex = nextBeatInBar === 0 ? (currentBarIndex + 1) % bars.length : currentBarIndex;
    const nextRoot = getProgressionCellForBeat(bars[nextBarIndex], nextBeatInBar).root;

    playBeat({
      beatInBar: stepPosition.beatInBar,
      beatEventType: getProgressionBeatEventType(currentBar, stepPosition.beatInBar),
      followingTieBeats: countFollowingProgressionTies(
        progression,
        currentBarIndex,
        stepPosition.beatInBar,
      ),
      rhythm,
      nextRoot,
    });
  }, [bars, playBeat, progression, rhythm]);

  useProgressionStepScheduler({
    isRunning,
    onStep: scheduleBeat,
    position,
  });
}
