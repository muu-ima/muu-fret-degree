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
} from "../../lib/progression/history";
import {
  applyProgressionBeatSubdivision,
  createProgressionVirtualTimeline,
  createDefaultProgression,
  removeProgressionRhythmEvent,
  updateProgressionBarCount,
  updateProgressionBeatChord,
  updateProgressionBeatDuration,
  updateProgressionBeatEventType,
  updateProgressionCell,
  updateProgressionRhythmEvent,
  validateProgressionRhythmPlacementAtPosition,
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionSubdivision,
} from "../../lib/progression";
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

  const updateBeatEventType = useCallback(
    (barIndex: number, beatIndex: number, eventType: ProgressionBeatEventType) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionBeatEventType(currentProgression, barIndex, beatIndex, eventType),
      });
    },
    [],
  );

  const updateBeatDuration = useCallback(
    (barIndex: number, beatIndex: number, durationSteps: ProgressionDurationSteps) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionBeatDuration(
            currentProgression,
            barIndex,
            beatIndex,
            durationSteps,
          ),
      });
    },
    [],
  );

  const updateRhythmEvent = useCallback(
    (
      barIndex: number,
      startStep: number,
      eventType: ProgressionBeatEventType,
      durationSteps: ProgressionDurationSteps,
    ) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionRhythmEvent(
            currentProgression,
            barIndex,
            startStep,
            eventType,
            durationSteps,
          ),
      });
    },
    [],
  );

  const removeRhythmEvent = useCallback((barIndex: number, startStep: number) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        removeProgressionRhythmEvent(currentProgression, barIndex, startStep),
    });
  }, []);

  const validateRhythmPlacement = useCallback(
    (
      barIndex: number,
      startStep: number,
      durationSteps: ProgressionDurationSteps,
    ) =>
      validateProgressionRhythmPlacementAtPosition(
        rhythmTimeline,
        barIndex,
        startStep,
        durationSteps,
      ),
    [rhythmTimeline],
  );

  const applyBeatSubdivision = useCallback(
    (barIndex: number, beatIndex: number, subdivision: ProgressionSubdivision) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          applyProgressionBeatSubdivision(
            currentProgression,
            barIndex,
            beatIndex,
            subdivision,
          ),
      });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    applyBeatSubdivision,
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    progression,
    redo,
    removeRhythmEvent,
    syncBpm,
    undo,
    updateBarCount,
    updateBeatChord,
    updateBeatDuration,
    updateBeatEventType,
    updateCell,
    updateRhythmEvent,
    validateRhythmPlacement,
  };
}
