"use client";

import type { ChordType } from "../../lib/music";
import {
  getProgressionRhythmPreset,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionHarmonyTarget,
  type ProgressionPlacementValidation,
  type ProgressionRhythmPresetId,
} from "../../lib/progression";
import { useProgressionHarmonyEditing } from "../../hooks/progression/useProgressionHarmonyEditing";
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

  const {
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
  } = useProgressionHarmonyEditing({
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
  });

  const selectedRhythmPreset = selectedBar
    ? getProgressionRhythmPreset(selectedBar, selectedBeatIndex)
    : undefined;

  if (!selectedBar || !selectedCell) {
    return null;
  }

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
