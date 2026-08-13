"use client";

import { useCallback, type Dispatch } from "react";
import {
  applyHarmonyToTargets,
  applyProgressionRhythmPreset,
  removeProgressionRhythmEvent,
  updateProgressionBarCount,
  updateProgressionBeatChord,
  updateProgressionBeatDuration,
  updateProgressionBeatEventType,
  updateProgressionCell,
  updateProgressionRhythmEvent,
  validateProgressionRhythmPlacementAtPosition,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionHarmonyTarget,
  type ProgressionRhythmPresetId,
  type ProgressionVirtualTimeline,
} from "../../lib/progression";
import type { ProgressionHistoryAction } from "../../lib/progression/state/history";

type UseProgressionCommandsOptions = {
  dispatch: Dispatch<ProgressionHistoryAction>;
  rhythmTimeline: ProgressionVirtualTimeline;
};

export function useProgressionCommands({
  dispatch,
  rhythmTimeline,
}: UseProgressionCommandsOptions) {
  const updateCell = useCallback((barIndex: number, cellIndex: number, nextCell: ProgressionCell) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        updateProgressionCell(currentProgression, barIndex, cellIndex, nextCell),
    });
  }, [dispatch]);

  const updateBarCount = useCallback((nextBarCount: number) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        updateProgressionBarCount(currentProgression, nextBarCount),
    });
  }, [dispatch]);

  const updateBeatChord = useCallback(
    (barIndex: number, beatIndex: number, nextCell: ProgressionCell | undefined) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionBeatChord(currentProgression, barIndex, beatIndex, nextCell),
      });
    },
    [dispatch],
  );

  const updateHarmonyTargets = useCallback(
    (targets: readonly ProgressionHarmonyTarget[], nextCell: ProgressionCell) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          applyHarmonyToTargets(currentProgression, nextCell, targets),
      });
    },
    [dispatch],
  );

  const updateBeatEventType = useCallback(
    (barIndex: number, beatIndex: number, eventType: ProgressionBeatEventType) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          updateProgressionBeatEventType(currentProgression, barIndex, beatIndex, eventType),
      });
    },
    [dispatch],
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
    [dispatch],
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
    [dispatch],
  );

  const removeRhythmEvent = useCallback((barIndex: number, startStep: number) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        removeProgressionRhythmEvent(currentProgression, barIndex, startStep),
    });
  }, [dispatch]);

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

  const applyRhythmPreset = useCallback(
    (barIndex: number, beatIndex: number, preset: ProgressionRhythmPresetId) => {
      dispatch({
        type: "commit",
        update: (currentProgression) =>
          applyProgressionRhythmPreset(
            currentProgression,
            barIndex,
            beatIndex,
            preset,
          ),
      });
    },
    [dispatch],
  );

  return {
    applyRhythmPreset,
    removeRhythmEvent,
    updateBarCount,
    updateBeatChord,
    updateBeatDuration,
    updateBeatEventType,
    updateCell,
    updateHarmonyTargets,
    updateRhythmEvent,
    validateRhythmPlacement,
  };
}
