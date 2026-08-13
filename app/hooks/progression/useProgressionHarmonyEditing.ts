"use client";

import { useEffect } from "react";
import {
  getProgressionCellForBeat,
  resolveHarmonyTargets,
  type ProgressionBar,
  type ProgressionCell,
  type ProgressionHarmonyTarget,
  type ProgressionSelectionRange,
  type ProgressionSelectionUnit,
} from "../../lib/progression";

type ProgressionHarmonyEditScope = "beat" | "cell";

type ProgressionHarmonySlotTarget = {
  barIndex: number;
  slotIndex: number;
};

type ProgressionHarmonyEditingOptions = {
  bars: readonly ProgressionBar[];
  lockedTargets: readonly ProgressionHarmonyTarget[];
  onBeatChordChange: (
    barIndex: number,
    beatIndex: number,
    cell: ProgressionCell | undefined,
  ) => void;
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
  onHarmonyTargetsChange: (
    targets: readonly ProgressionHarmonyTarget[],
    cell: ProgressionCell,
  ) => void;
  selectBeat: (barIndex: number, beatIndex: number, extendSelection?: boolean) => void;
  selectedBarIndex: number;
  selectedBeatIndex: number;
  selectionRange: ProgressionSelectionRange;
  selectionUnit: ProgressionSelectionUnit;
};

export function getProgressionHarmonySlotIndex(
  editScope: ProgressionHarmonyEditScope,
  selectedBarIndex: number,
  selectedBeatIndex: number,
  selectedCellIndex: number,
) {
  if (editScope === "beat") {
    return selectedBarIndex * 4 + selectedBeatIndex;
  }

  return selectedBarIndex * 2 + selectedCellIndex;
}

export function getProgressionHarmonySlotTarget(
  editScope: ProgressionHarmonyEditScope,
  slotIndex: number,
): ProgressionHarmonySlotTarget {
  if (editScope === "beat") {
    return {
      barIndex: Math.floor(slotIndex / 4),
      slotIndex: slotIndex % 4,
    };
  }

  return {
    barIndex: Math.floor(slotIndex / 2),
    slotIndex: slotIndex % 2,
  };
}

export function useProgressionHarmonyEditing({
  bars,
  lockedTargets,
  onBeatChordChange,
  onCellChange,
  onHarmonyTargetsChange,
  selectBeat,
  selectedBarIndex,
  selectedBeatIndex,
  selectionRange,
  selectionUnit,
}: ProgressionHarmonyEditingOptions) {
  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedCellIndex = Math.floor(selectedBeatIndex / 2);
  const baseCell = selectedBar?.cells[selectedCellIndex];
  const beatOverride = selectedBar?.beats?.[selectedBeatIndex]?.chordOverride;
  const editScope: ProgressionHarmonyEditScope = beatOverride ? "beat" : "cell";
  const selectedCell = editScope === "beat" ? beatOverride ?? baseCell : baseCell;
  const isRangeSelectionActive =
    selectionUnit !== "beat" || selectionRange.startSlot !== selectionRange.endSlot;
  const hasLockedTargets = lockedTargets.length > 0;

  const harmonySlotCount = editScope === "beat" ? bars.length * 4 : bars.length * 2;
  const selectedHarmonySlotIndex = getProgressionHarmonySlotIndex(
    editScope,
    selectedBarIndex,
    selectedBeatIndex,
    selectedCellIndex,
  );
  const canCopyHarmonyToPrevious = selectedHarmonySlotIndex > 0;
  const canCopyHarmonyToNext = selectedHarmonySlotIndex < harmonySlotCount - 1;

  const copyHarmonyToAdjacentSlot = (direction: -1 | 1) => {
    if (!selectedCell) {
      return;
    }

    const nextSlotIndex = selectedHarmonySlotIndex + direction;
    if (nextSlotIndex < 0 || nextSlotIndex >= harmonySlotCount) {
      return;
    }

    if (editScope === "beat") {
      const { barIndex: nextBarIndex, slotIndex: nextBeatIndex } =
        getProgressionHarmonySlotTarget(editScope, nextSlotIndex);
      onBeatChordChange(nextBarIndex, nextBeatIndex, selectedCell);
      selectBeat(nextBarIndex, nextBeatIndex);
      return;
    }

    const { barIndex: nextBarIndex, slotIndex: nextCellIndex } =
      getProgressionHarmonySlotTarget(editScope, nextSlotIndex);
    onCellChange(nextBarIndex, nextCellIndex, selectedCell);
    selectBeat(nextBarIndex, nextCellIndex * 2);
  };

  const applyCellChange = (nextCell: ProgressionCell) => {
    if (hasLockedTargets) {
      onHarmonyTargetsChange(lockedTargets, nextCell);
      return;
    }

    if (isRangeSelectionActive) {
      onHarmonyTargetsChange(resolveHarmonyTargets(selectionRange, bars), nextCell);
      return;
    }

    if (editScope === "beat") {
      onBeatChordChange(selectedBarIndex, selectedBeatIndex, nextCell);
      return;
    }

    onCellChange(selectedBarIndex, selectedCellIndex, nextCell);
  };

  const useCellScope = () => {
    onBeatChordChange(selectedBarIndex, selectedBeatIndex, undefined);
  };

  const useBeatScope = () => {
    if (!selectedBar || beatOverride) {
      return;
    }

    onBeatChordChange(
      selectedBarIndex,
      selectedBeatIndex,
      getProgressionCellForBeat(selectedBar, selectedBeatIndex),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      copyHarmonyToAdjacentSlot(event.key === "ArrowRight" ? 1 : -1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return {
    applyCellChange,
    canCopyHarmonyToNext,
    canCopyHarmonyToPrevious,
    copyHarmonyToAdjacentSlot,
    editScope,
    hasLockedTargets,
    isRangeSelectionActive,
    selectedBar,
    selectedCell,
    selectedCellIndex,
    useBeatScope,
    useCellScope,
  };
}
