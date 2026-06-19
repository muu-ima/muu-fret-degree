"use client";

import { useCallback, useEffect, useReducer, type Dispatch, type SetStateAction } from "react";
import type { ChordType } from "../lib/music";
import {
  createProgressionHistory,
  progressionHistoryReducer,
} from "../lib/progression-history";
import {
  createDefaultProgression,
  updateProgressionBarCount,
  updateProgressionBeatChord,
  updateProgressionCell,
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
  const [history, dispatch] = useReducer(progressionHistoryReducer, undefined, () =>
    createProgressionHistory(createDefaultProgression(bpm)),
  );
  const progression = history.present;

  const hydrateProgression: Dispatch<SetStateAction<ChordProgression>> = useCallback((update) => {
    dispatch({ type: "hydrate", update });
  }, []);

  const syncBpm = useCallback((nextBpm: number) => {
    dispatch({ type: "sync-bpm", bpm: nextBpm });
  }, []);

  useEffect(() => {
    syncBpm(bpm);
  }, [bpm, syncBpm]);

  usePersistedProgression({
    progression,
    setProgression: hydrateProgression,
    roots,
    chordTypes,
  });

  const updateCell = useCallback((barIndex: number, cellIndex: number, nextCell: ProgressionCell) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        updateProgressionCell(currentProgression, barIndex, cellIndex, nextCell),
    });
  }, []);

  const updateBarCount = useCallback((nextBarCount: number) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        updateProgressionBarCount(currentProgression, nextBarCount),
    });
  }, []);

  const updateBeatChord = useCallback(
    (barIndex: number, beatIndex: number, nextCell: ProgressionCell | undefined) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionBeatChord(currentProgression, barIndex, beatIndex, nextCell),
      });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    progression,
    redo,
    syncBpm,
    undo,
    updateBarCount,
    updateBeatChord,
    updateCell,
  };
}
