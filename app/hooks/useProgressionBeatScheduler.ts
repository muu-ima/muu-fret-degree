"use client";

import { useEffect, useRef } from "react";
import type { ProgressionRhythm } from "./useChordPlayback";
import type { ChordProgression, ProgressionPosition } from "../lib/progression";

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
    const currentBar = bars[currentBarIndex];
    const currentCellIndex = Math.min(Math.floor(beatInBar / 2), 1);
    const nextRoot =
      currentCellIndex === 0
        ? currentBar.cells[1].root
        : bars[(currentBarIndex + 1) % bars.length].cells[0].root;

    playBeat({
      beatInBar,
      rhythm,
      nextRoot,
    });
  }, [barIndex, bars, beatIndex, beatInBar, isRunning, playBeat, rhythm]);
}
