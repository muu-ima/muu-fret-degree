"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ChordType } from "../../lib/music";
import {
  createProgressionHistory,
  progressionHistoryReducer,
} from "../../lib/progression/state/history";
import {
  createProgressionVirtualTimeline,
  createDefaultProgression,
  type ChordProgression,
} from "../../lib/progression";
import { useProgressionCommands } from "./useProgressionCommands";
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
  const rhythmTimeline = useMemo(
    () => createProgressionVirtualTimeline(progression),
    [progression],
  );

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
  const commands = useProgressionCommands({ dispatch, rhythmTimeline });

  const resetProgression = useCallback(() => {
    dispatch({
      type: "commit",
      update: (currentProgression) => createDefaultProgression(currentProgression.bpm),
    });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    applyRhythmPreset: commands.applyRhythmPreset,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    progression,
    redo,
    resetProgression,
    removeRhythmEvent: commands.removeRhythmEvent,
    syncBpm,
    undo,
    updateBarCount: commands.updateBarCount,
    updateBeatChord: commands.updateBeatChord,
    updateBeatDuration: commands.updateBeatDuration,
    updateBeatEventType: commands.updateBeatEventType,
    updateCell: commands.updateCell,
    updateHarmonyTargets: commands.updateHarmonyTargets,
    updateRhythmEvent: commands.updateRhythmEvent,
    validateRhythmPlacement: commands.validateRhythmPlacement,
  };
}
