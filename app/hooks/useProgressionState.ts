"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChordType } from "../lib/music";
import {
  createDefaultProgression,
  resizeProgressionBars,
  type ChordProgression,
  type ProgressionCell,
} from "../lib/progression";
import { usePersistedProgression } from "./usePersistedProgression";

type UseProgressionStateOptions = {
  bpm?: number;
  roots: string[];
  chordTypes: ChordType[];
};

export function useProgressionState({ bpm = 120, roots, chordTypes }: UseProgressionStateOptions) {
  const [progression, setProgression] = useState<ChordProgression>(() => createDefaultProgression(bpm));

  useEffect(() => {
    setProgression((currentProgression) =>
      currentProgression.bpm === bpm ? currentProgression : { ...currentProgression, bpm },
    );
  }, [bpm]);

  usePersistedProgression({
    progression,
    setProgression,
    roots,
    chordTypes,
  });

  const updateCell = useCallback((barIndex: number, cellIndex: number, nextCell: ProgressionCell) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: currentProgression.bars.map((bar, index) => {
        if (index !== barIndex) {
          return bar;
        }

        return {
          ...bar,
          cells: [
            cellIndex === 0 ? nextCell : bar.cells[0],
            cellIndex === 1 ? nextCell : bar.cells[1],
          ] as const,
        };
      }),
    }));
  }, []);

  const updateBarCount = useCallback((nextBarCount: number) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: resizeProgressionBars(currentProgression.bars, nextBarCount),
    }));
  }, []);

  return {
    progression,
    updateBarCount,
    updateCell,
  };
}
