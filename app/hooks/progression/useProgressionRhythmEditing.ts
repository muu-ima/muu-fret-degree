"use client";

import {
  canTieProgressionBeat,
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionRhythmEventAtStep,
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPlacementValidation,
} from "../../lib/progression";

type EditableProgressionEventType = ProgressionBeatEventType | "empty";

type UseProgressionRhythmEditingOptions = {
  bars: readonly ProgressionBar[];
  onBeatDurationChange: (
    barIndex: number,
    beatIndex: number,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onBeatEventTypeChange: (
    barIndex: number,
    beatIndex: number,
    eventType: ProgressionBeatEventType,
  ) => void;
  onRhythmEventChange: (
    barIndex: number,
    startStep: number,
    eventType: ProgressionBeatEventType,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onRhythmEventRemove: (barIndex: number, startStep: number) => void;
  selectedBar: ProgressionBar;
  selectedBarIndex: number;
  selectedBeatIndex: number;
  selectedStepInBeat: number;
  validateRhythmPlacement: (
    barIndex: number,
    startStep: number,
    durationSteps: ProgressionDurationSteps,
  ) => ProgressionPlacementValidation;
};

export function getProgressionRhythmEditStartStep(
  selectedBeatIndex: number,
  selectedStepInBeat: number,
) {
  return selectedBeatIndex * progressionStepsPerBeat + selectedStepInBeat;
}

export function useProgressionRhythmEditing({
  bars,
  onBeatDurationChange,
  onBeatEventTypeChange,
  onRhythmEventChange,
  onRhythmEventRemove,
  selectedBar,
  selectedBarIndex,
  selectedBeatIndex,
  selectedStepInBeat,
  validateRhythmPlacement,
}: UseProgressionRhythmEditingOptions) {
  const selectedStartStep = getProgressionRhythmEditStartStep(
    selectedBeatIndex,
    selectedStepInBeat,
  );
  const selectedRhythmEvent = getProgressionRhythmEventAtStep(selectedBar, selectedStartStep);
  const selectedEventType =
    selectedStepInBeat === 0
      ? getProgressionBeatEventType(selectedBar, selectedBeatIndex)
      : selectedRhythmEvent?.eventType;
  const selectedDuration =
    selectedStepInBeat === 0
      ? getProgressionBeatDuration(selectedBar, selectedBeatIndex)
      : selectedRhythmEvent?.durationSteps ?? 1;
  const selectedEventLabel = selectedEventType
    ? selectedEventType[0].toUpperCase() + selectedEventType.slice(1)
    : "Empty";
  const placementValidation = validateRhythmPlacement(
    selectedBarIndex,
    selectedStartStep,
    selectedDuration,
  );

  const changeEventType = (eventType: EditableProgressionEventType) => {
    if (eventType === "empty") {
      onRhythmEventRemove(selectedBarIndex, selectedStartStep);
    } else if (selectedStepInBeat === 0) {
      onBeatEventTypeChange(selectedBarIndex, selectedBeatIndex, eventType);
    } else {
      onRhythmEventChange(
        selectedBarIndex,
        selectedStartStep,
        eventType,
        selectedRhythmEvent?.durationSteps ?? 1,
      );
    }
  };

  const changeDuration = (durationSteps: ProgressionDurationSteps) => {
    if (selectedStepInBeat === 0) {
      onBeatDurationChange(selectedBarIndex, selectedBeatIndex, durationSteps);
    } else {
      onRhythmEventChange(selectedBarIndex, selectedStartStep, "hit", durationSteps);
    }
  };

  const validateDuration = (durationSteps: ProgressionDurationSteps) =>
    validateRhythmPlacement(selectedBarIndex, selectedStartStep, durationSteps);

  return {
    canTie: canTieProgressionBeat(bars, selectedBarIndex, selectedBeatIndex),
    changeDuration,
    changeEventType,
    placementValidation,
    selectedDuration,
    selectedEventLabel,
    selectedEventType,
    validateDuration,
  };
}
