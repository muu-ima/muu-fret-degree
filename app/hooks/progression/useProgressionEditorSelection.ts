"use client";

import { useEffect, useState } from "react";
import {
  resolveHarmonyTargets,
  type ProgressionBar,
  type ProgressionHarmonyTarget,
  type ProgressionSelectionRange,
  type ProgressionSelectionUnit,
} from "../../lib/progression";

type ProgressionEditorPosition = {
  barIndex: number;
  beatIndex: number;
};

export function getProgressionSelectionSlotIndex(
  unit: ProgressionSelectionUnit,
  barIndex: number,
  beatIndex: number,
) {
  if (unit === "bar") {
    return barIndex;
  }

  if (unit === "cell") {
    return barIndex * 2 + Math.floor(beatIndex / 2);
  }

  return barIndex * 4 + beatIndex;
}

export function useProgressionEditorSelection(bars: readonly ProgressionBar[]) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepInBeat, setSelectedStepInBeat] = useState(0);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [selectionUnit, setSelectionUnit] = useState<ProgressionSelectionUnit>("cell");
  const [selectionAnchor, setSelectionAnchor] = useState<ProgressionEditorPosition>({ barIndex: 0, beatIndex: 0 });
  const [selectionRange, setSelectionRange] = useState<ProgressionSelectionRange>({
    unit: "cell",
    startSlot: 0,
    endSlot: 0,
  });
  const [lockedTargets, setLockedTargets] = useState<readonly ProgressionHarmonyTarget[]>([]);

  useEffect(() => {
    setSelectedBarIndex((currentIndex) => Math.min(currentIndex, Math.max(bars.length - 1, 0)));
  }, [bars.length]);

  const selectBeat = (barIndex: number, beatIndex: number, extendSelection = false) => {
    setSelectedBarIndex(barIndex);
    setSelectedBeatIndex(beatIndex);
    setSelectedStepInBeat(0);

    const currentSlot = getProgressionSelectionSlotIndex(selectionUnit, barIndex, beatIndex);
    if (extendSelection) {
      const anchorSlot = getProgressionSelectionSlotIndex(
        selectionUnit,
        selectionAnchor.barIndex,
        selectionAnchor.beatIndex,
      );
      setSelectionRange({
        unit: selectionUnit,
        startSlot: Math.min(anchorSlot, currentSlot),
        endSlot: Math.max(anchorSlot, currentSlot),
      });
      return;
    }

    setSelectionAnchor({ barIndex, beatIndex });
    setSelectionRange({
      unit: selectionUnit,
      startSlot: currentSlot,
      endSlot: currentSlot,
    });
  };

  const changeSelectionUnit = (nextUnit: ProgressionSelectionUnit) => {
    setSelectionUnit(nextUnit);
    const currentSlot = getProgressionSelectionSlotIndex(nextUnit, selectedBarIndex, selectedBeatIndex);
    setSelectionAnchor({ barIndex: selectedBarIndex, beatIndex: selectedBeatIndex });
    setSelectionRange({
      unit: nextUnit,
      startSlot: currentSlot,
      endSlot: currentSlot,
    });
  };

  const clearSelectionRange = () => {
    setSelectionUnit("beat");
    const currentSlot = getProgressionSelectionSlotIndex("beat", selectedBarIndex, selectedBeatIndex);
    setSelectionAnchor({ barIndex: selectedBarIndex, beatIndex: selectedBeatIndex });
    setSelectionRange({
      unit: "beat",
      startSlot: currentSlot,
      endSlot: currentSlot,
    });
  };

  const lockSelectionRange = () => {
    setLockedTargets(resolveHarmonyTargets(selectionRange, bars));
  };

  const clearLockedTargets = () => {
    setLockedTargets([]);
  };

  const beginDragSelection = (barIndex: number, beatIndex: number) => {
    setIsDragSelecting(true);
    selectBeat(barIndex, beatIndex, false);
  };

  const extendDragSelection = (barIndex: number, beatIndex: number) => {
    if (!isDragSelecting) {
      return;
    }

    selectBeat(barIndex, beatIndex, true);
  };

  useEffect(() => {
    if (!isDragSelecting) {
      return;
    }

    const stopDragSelection = () => setIsDragSelecting(false);
    window.addEventListener("pointerup", stopDragSelection);
    window.addEventListener("pointercancel", stopDragSelection);
    return () => {
      window.removeEventListener("pointerup", stopDragSelection);
      window.removeEventListener("pointercancel", stopDragSelection);
    };
  }, [isDragSelecting]);

  return {
    beginDragSelection,
    changeSelectionUnit,
    clearLockedTargets,
    clearSelectionRange,
    extendDragSelection,
    lockedTargets,
    lockSelectionRange,
    selectedBarIndex,
    selectedBeatIndex,
    selectedStepInBeat,
    selectBeat,
    selectionRange,
    selectionUnit,
    setSelectedStepInBeat,
  };
}
