"use client";

import { useEffect, useRef } from "react";
import {
  getProgressionCellForBeat,
  type ChordProgression,
  type ProgressionPosition,
} from "../lib/progression";
import type { ProgressionRhythm } from "../lib/progression-playback";

type UseProgressionBeatSchedulerOptions = {
  isRunning: boolean;
  playBeat: (options: {
    beatInBar: number;
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
  const lastBeatRef = useRef<number | null>(null);
  const { barIndex, beatIndex, beatInBar } = position;
  const bars = progression.bars;

  useEffect(() => {
    if (!isRunning || bars.length === 0) {
      lastBeatRef.current = null;
      return;
    }

    if (lastBeatRef.current === beatIndex) {
      return;
    }

    lastBeatRef.current = beatIndex;
    const currentBarIndex = barIndex % bars.length;
    const beatsPerBar = Math.max(1, Math.floor(progression.timeSignature.beatsPerBar));
    const nextBeatInBar = (beatInBar + 1) % beatsPerBar;
    const nextBarIndex = nextBeatInBar === 0 ? (currentBarIndex + 1) % bars.length : currentBarIndex;
    const nextRoot = getProgressionCellForBeat(bars[nextBarIndex], nextBeatInBar).root;

    playBeat({
      beatInBar,
      rhythm,
      nextRoot,
    });
  }, [barIndex, bars, beatIndex, beatInBar, isRunning, playBeat, progression.timeSignature.beatsPerBar, rhythm]);
}
