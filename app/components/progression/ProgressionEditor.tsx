"use client";

import { useEffect, useState } from "react";
import type { ChordType } from "../../lib/music";
import {
  getProgressionRhythmPreset,
  getProgressionCellForBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionPlacementValidation,
  type ProgressionRhythmPresetId,
} from "../../lib/progression";
import { ProgressionChordChart } from "./ProgressionChordChart";
import { ProgressionAdvancedRhythm } from "./editor/ProgressionAdvancedRhythm";
import { ProgressionEditorHeader } from "./editor/ProgressionEditorHeader";
import { ProgressionHarmonyEditor } from "./editor/ProgressionHarmonyEditor";
import { ProgressionRhythmPreset } from "./editor/ProgressionRhythmPreset";
import { ProgressionSelectionHeader } from "./editor/ProgressionSelectionHeader";

type ProgressionSelectionUnit = "beat" | "cell" | "bar";

type ProgressionSelectionRange = {
  unit: ProgressionSelectionUnit;
  startSlot: number;
  endSlot: number;
};

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
  onRhythmEventChange,
  onRhythmEventRemove,
  validateRhythmPlacement,
}: ProgressionEditorProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepInBeat, setSelectedStepInBeat] = useState(0);
  const [selectionUnit, setSelectionUnit] = useState<ProgressionSelectionUnit>("beat");
  const [selectionAnchor, setSelectionAnchor] = useState({ barIndex: 0, beatIndex: 0 });
  const [selectionRange, setSelectionRange] = useState<ProgressionSelectionRange>({
    unit: "beat",
    startSlot: 0,
    endSlot: 0,
  });

  useEffect(() => {
    setSelectedBarIndex((currentIndex) => Math.min(currentIndex, Math.max(bars.length - 1, 0)));
  }, [bars.length]);

  const getSelectionSlotIndex = (
    unit: ProgressionSelectionUnit,
    barIndex: number,
    beatIndex: number,
  ) => {
    if (unit === "bar") {
      return barIndex;
    }

    if (unit === "cell") {
      return barIndex * 2 + Math.floor(beatIndex / 2);
    }

    return barIndex * 4 + beatIndex;
  };

  const selectBeat = (barIndex: number, beatIndex: number, extendSelection = false) => {
    setSelectedBarIndex(barIndex);
    setSelectedBeatIndex(beatIndex);
    setSelectedStepInBeat(0);

    const currentSlot = getSelectionSlotIndex(selectionUnit, barIndex, beatIndex);
    if (extendSelection) {
      const anchorSlot = getSelectionSlotIndex(
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
    const currentSlot = getSelectionSlotIndex(nextUnit, selectedBarIndex, selectedBeatIndex);
    setSelectionAnchor({ barIndex: selectedBarIndex, beatIndex: selectedBeatIndex });
    setSelectionRange({
      unit: nextUnit,
      startSlot: currentSlot,
      endSlot: currentSlot,
    });
  };

  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedRhythmPreset = selectedBar
    ? getProgressionRhythmPreset(selectedBar, selectedBeatIndex)
    : undefined;
  const selectedCellIndex = Math.floor(selectedBeatIndex / 2);
  const baseCell = selectedBar?.cells[selectedCellIndex];
  const beatOverride = selectedBar?.beats?.[selectedBeatIndex]?.chordOverride;
  const editScope = beatOverride ? "beat" : "cell";
  const selectedCell = editScope === "beat" ? beatOverride ?? baseCell : baseCell;

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
        selectionRange={selectionRange}
        selectionUnit={selectionUnit}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        selectedStepInBeat={selectedStepInBeat}
        onBeatSelect={selectBeat}
      />
      <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
        <ProgressionSelectionHeader
          barNumber={selectedBar.bar}
          beatIndex={selectedBeatIndex}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
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
