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

  useEffect(() => {
    setSelectedBarIndex((currentIndex) => Math.min(currentIndex, Math.max(bars.length - 1, 0)));
  }, [bars.length]);

  const selectBeat = (barIndex: number, beatIndex: number) => {
    setSelectedBarIndex(barIndex);
    setSelectedBeatIndex(beatIndex);
    setSelectedStepInBeat(0);
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
          selectedCell={selectedCell}
          stepInBeat={selectedStepInBeat}
        />
        <ProgressionHarmonyEditor
          beatIndex={selectedBeatIndex}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
          onBeatSelect={(beatIndex) => selectBeat(selectedBarIndex, beatIndex)}
          onCellChange={applyCellChange}
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
