"use client";

import { useEffect } from "react";
import type { ChordType } from "../../lib/music";
import {
  getProgressionRhythmPreset,
  resolveHarmonyTargets,
  getProgressionCellForBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionHarmonyTarget,
  type ProgressionPlacementValidation,
  type ProgressionRhythmPresetId,
} from "../../lib/progression";
import { useProgressionEditorSelection } from "../../hooks/progression/useProgressionEditorSelection";
import { ProgressionChordChart } from "./ProgressionChordChart";
import { ProgressionAdvancedRhythm } from "./editor/ProgressionAdvancedRhythm";
import { ProgressionEditorHeader } from "./editor/ProgressionEditorHeader";
import { ProgressionHarmonyEditor } from "./editor/ProgressionHarmonyEditor";
import { ProgressionRhythmPreset } from "./editor/ProgressionRhythmPreset";
import { ProgressionSelectionHeader } from "./editor/ProgressionSelectionHeader";

type ProgressionEditorProps = {
  className?: string;
  bars: readonly ProgressionBar[];
  barCount: number;
  barCountOptions: number[];
  roots: string[];
  chordTypes: ChordType[];
  onBarCountChange: (barCount: number) => void;
  onRhythmPresetApply: (
    barIndex: number,
    beatIndex: number,
    preset: ProgressionRhythmPresetId,
  ) => void;
  onBeatChordChange: (
    barIndex: number,
    beatIndex: number,
    cell: ProgressionCell | undefined,
  ) => void;
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
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
  onHarmonyTargetsChange: (
    targets: readonly ProgressionHarmonyTarget[],
    cell: ProgressionCell,
  ) => void;
  onRhythmEventChange: (
    barIndex: number,
    startStep: number,
    eventType: ProgressionBeatEventType,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onRhythmEventRemove: (barIndex: number, startStep: number) => void;
  validateRhythmPlacement: (
    barIndex: number,
    startStep: number,
    durationSteps: ProgressionDurationSteps,
  ) => ProgressionPlacementValidation;
};

export function ProgressionEditor({
  className = "progressionEditor",
  bars,
  barCount,
  barCountOptions,
  roots,
  chordTypes,
  onBarCountChange,
  onRhythmPresetApply,
  onBeatChordChange,
  onBeatDurationChange,
  onBeatEventTypeChange,
  onCellChange,
  onHarmonyTargetsChange,
  onRhythmEventChange,
  onRhythmEventRemove,
  validateRhythmPlacement,
}: ProgressionEditorProps) {
  const {
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
  } = useProgressionEditorSelection(bars);

  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedRhythmPreset = selectedBar
    ? getProgressionRhythmPreset(selectedBar, selectedBeatIndex)
    : undefined;
  const selectedCellIndex = Math.floor(selectedBeatIndex / 2);
  const baseCell = selectedBar?.cells[selectedCellIndex];
  const beatOverride = selectedBar?.beats?.[selectedBeatIndex]?.chordOverride;
  const editScope = beatOverride ? "beat" : "cell";
  const selectedCell = editScope === "beat" ? beatOverride ?? baseCell : baseCell;
  const isRangeSelectionActive =
    selectionUnit !== "beat" || selectionRange.startSlot !== selectionRange.endSlot;
  const hasLockedTargets = lockedTargets.length > 0;

  const harmonySlotCount = editScope === "beat" ? bars.length * 4 : bars.length * 2;
  const selectedHarmonySlotIndex = editScope === "beat"
    ? selectedBarIndex * 4 + selectedBeatIndex
    : selectedBarIndex * 2 + selectedCellIndex;
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
      const nextBarIndex = Math.floor(nextSlotIndex / 4);
      const nextBeatIndex = nextSlotIndex % 4;
      onBeatChordChange(nextBarIndex, nextBeatIndex, selectedCell);
      selectBeat(nextBarIndex, nextBeatIndex);
      return;
    }

    const nextBarIndex = Math.floor(nextSlotIndex / 2);
    const nextCellIndex = nextSlotIndex % 2;
    onCellChange(nextBarIndex, nextCellIndex, selectedCell);
    selectBeat(nextBarIndex, nextCellIndex * 2);
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

  if (!selectedBar || !selectedCell) {
    return null;
  }

  const applyCellChange = (nextCell: ProgressionCell) => {
    if (hasLockedTargets) {
      onHarmonyTargetsChange(lockedTargets, nextCell);
      return;
    }

    const shouldApplyRangeSelection =
      selectionUnit !== "beat" || selectionRange.startSlot !== selectionRange.endSlot;

    if (shouldApplyRangeSelection) {
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
    if (!beatOverride) {
      onBeatChordChange(
        selectedBarIndex,
        selectedBeatIndex,
        getProgressionCellForBeat(selectedBar, selectedBeatIndex),
      );
    }
  };

  const applyRhythmPreset = (preset: ProgressionRhythmPresetId) => {
    setSelectedStepInBeat(0);
    onRhythmPresetApply(selectedBarIndex, selectedBeatIndex, preset);
  };

  return (
    <section className={className} aria-label="コード進行編集">
      <ProgressionEditorHeader
        barCount={barCount}
        barCountOptions={barCountOptions}
        onBarCountChange={onBarCountChange}
      />
      <ProgressionChordChart
        bars={bars}
        chordTypes={chordTypes}
        lockedTargets={lockedTargets}
        selectionRange={selectionRange}
        selectionUnit={selectionUnit}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        selectedStepInBeat={selectedStepInBeat}
        onBeatPointerDown={beginDragSelection}
        onBeatPointerEnter={extendDragSelection}
        onBeatSelect={selectBeat}
      />
      <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
        <ProgressionSelectionHeader
          barNumber={selectedBar.bar}
          beatIndex={selectedBeatIndex}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
          hasLockedTargets={hasLockedTargets}
          isRangeSelectionActive={isRangeSelectionActive}
          onClearSelectionRange={clearSelectionRange}
          onClearLockedTargets={clearLockedTargets}
          onLockSelectionRange={lockSelectionRange}
          onSelectionUnitChange={changeSelectionUnit}
          selectedCell={selectedCell}
          selectionRange={selectionRange}
          selectionUnit={selectionUnit}
          stepInBeat={selectedStepInBeat}
        />
        <ProgressionHarmonyEditor
          beatIndex={selectedBeatIndex}
          canCopyHarmonyToNext={canCopyHarmonyToNext}
          canCopyHarmonyToPrevious={canCopyHarmonyToPrevious}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
          hasLockedTargets={hasLockedTargets}
          isRangeSelectionActive={isRangeSelectionActive}
          onBeatSelect={(beatIndex) => selectBeat(selectedBarIndex, beatIndex)}
          onCellChange={applyCellChange}
          onHarmonyCopy={copyHarmonyToAdjacentSlot}
          onUseBeatScope={useBeatScope}
          onUseCellScope={useCellScope}
          roots={roots}
          selectedCell={selectedCell}
        />
        <ProgressionRhythmPreset
          onApply={applyRhythmPreset}
          selectedPreset={selectedRhythmPreset}
        />
        <ProgressionAdvancedRhythm
          bars={bars}
          onBeatDurationChange={onBeatDurationChange}
          onBeatEventTypeChange={onBeatEventTypeChange}
          onRhythmEventChange={onRhythmEventChange}
          onRhythmEventRemove={onRhythmEventRemove}
          onStepChange={setSelectedStepInBeat}
          selectedBar={selectedBar}
          selectedBarIndex={selectedBarIndex}
          selectedBeatIndex={selectedBeatIndex}
          selectedStepInBeat={selectedStepInBeat}
          validateRhythmPlacement={validateRhythmPlacement}
        />
      </section>
    </section>
  );
}
