"use client";

import type { ChordType } from "../../lib/music";
import {
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
import { ProgressionEditorHeader } from "./editor/ProgressionEditorHeader";
import { ProgressionSelectionPanel } from "./editor/ProgressionSelectionPanel";

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

  if (!selectedBar || !selectedCell) {
    return null;
  }

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
      <ProgressionSelectionPanel
        bars={bars}
        beatIndex={selectedBeatIndex}
        canCopyHarmonyToNext={canCopyHarmonyToNext}
        canCopyHarmonyToPrevious={canCopyHarmonyToPrevious}
        cellIndex={selectedCellIndex}
        chordTypes={chordTypes}
        editScope={editScope}
        hasLockedTargets={hasLockedTargets}
        isRangeSelectionActive={isRangeSelectionActive}
        onBeatDurationChange={onBeatDurationChange}
        onBeatEventTypeChange={onBeatEventTypeChange}
        onCellChange={applyCellChange}
        onClearLockedTargets={clearLockedTargets}
        onClearSelectionRange={clearSelectionRange}
        onHarmonyCopy={copyHarmonyToAdjacentSlot}
        onLockSelectionRange={lockSelectionRange}
        onRhythmEventChange={onRhythmEventChange}
        onRhythmEventRemove={onRhythmEventRemove}
        onRhythmPresetApply={onRhythmPresetApply}
        onSelectedBeatChange={(beatIndex) => selectBeat(selectedBarIndex, beatIndex)}
        onSelectionUnitChange={changeSelectionUnit}
        onStepChange={setSelectedStepInBeat}
        onUseBeatScope={useBeatScope}
        onUseCellScope={useCellScope}
        roots={roots}
        selectedBar={selectedBar}
        selectedBarIndex={selectedBarIndex}
        selectedCell={selectedCell}
        selectedStepInBeat={selectedStepInBeat}
        selectionRange={selectionRange}
        selectionUnit={selectionUnit}
        validateRhythmPlacement={validateRhythmPlacement}
      />
    </section>
  );
}
