import type { ChordType } from "../../../lib/music";
import {
  getProgressionRhythmPreset,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionHarmonyTarget,
  type ProgressionPlacementValidation,
  type ProgressionRhythmPresetId,
  type ProgressionSelectionRange,
  type ProgressionSelectionUnit,
} from "../../../lib/progression";
import { ProgressionAdvancedRhythm } from "./ProgressionAdvancedRhythm";
import { ProgressionHarmonyEditor } from "./ProgressionHarmonyEditor";
import { ProgressionRhythmPreset } from "./ProgressionRhythmPreset";
import { ProgressionSelectionHeader } from "./ProgressionSelectionHeader";

type ProgressionSelectionPanelProps = {
  bars: readonly ProgressionBar[];
  beatIndex: number;
  canCopyHarmonyToNext: boolean;
  canCopyHarmonyToPrevious: boolean;
  cellIndex: number;
  chordTypes: ChordType[];
  editScope: "beat" | "cell";
  hasLockedTargets: boolean;
  isRangeSelectionActive: boolean;
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
  onCellChange: (cell: ProgressionCell) => void;
  onClearLockedTargets: () => void;
  onClearSelectionRange: () => void;
  onHarmonyCopy: (direction: -1 | 1) => void;
  onLockSelectionRange: () => void;
  onRhythmEventChange: (
    barIndex: number,
    startStep: number,
    eventType: ProgressionBeatEventType,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onRhythmEventRemove: (barIndex: number, startStep: number) => void;
  onRhythmPresetApply: (
    barIndex: number,
    beatIndex: number,
    preset: ProgressionRhythmPresetId,
  ) => void;
  onSelectedBeatChange: (beatIndex: number) => void;
  onSelectionUnitChange: (unit: ProgressionSelectionUnit) => void;
  onStepChange: (stepInBeat: number) => void;
  onUseBeatScope: () => void;
  onUseCellScope: () => void;
  roots: readonly string[];
  selectedBar: ProgressionBar;
  selectedBarIndex: number;
  selectedCell: ProgressionCell;
  selectedStepInBeat: number;
  selectionRange: ProgressionSelectionRange;
  selectionUnit: ProgressionSelectionUnit;
  validateRhythmPlacement: (
    barIndex: number,
    startStep: number,
    durationSteps: ProgressionDurationSteps,
  ) => ProgressionPlacementValidation;
};

export function ProgressionSelectionPanel({
  bars,
  beatIndex,
  canCopyHarmonyToNext,
  canCopyHarmonyToPrevious,
  cellIndex,
  chordTypes,
  editScope,
  hasLockedTargets,
  isRangeSelectionActive,
  onBeatDurationChange,
  onBeatEventTypeChange,
  onCellChange,
  onClearLockedTargets,
  onClearSelectionRange,
  onHarmonyCopy,
  onLockSelectionRange,
  onRhythmEventChange,
  onRhythmEventRemove,
  onRhythmPresetApply,
  onSelectedBeatChange,
  onSelectionUnitChange,
  onStepChange,
  onUseBeatScope,
  onUseCellScope,
  roots,
  selectedBar,
  selectedBarIndex,
  selectedCell,
  selectedStepInBeat,
  selectionRange,
  selectionUnit,
  validateRhythmPlacement,
}: ProgressionSelectionPanelProps) {
  const selectedRhythmPreset = getProgressionRhythmPreset(selectedBar, beatIndex);

  const applyRhythmPreset = (preset: ProgressionRhythmPresetId) => {
    onStepChange(0);
    onRhythmPresetApply(selectedBarIndex, beatIndex, preset);
  };

  return (
    <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
      <ProgressionSelectionHeader
        barNumber={selectedBar.bar}
        beatIndex={beatIndex}
        cellIndex={cellIndex}
        chordTypes={chordTypes}
        editScope={editScope}
        hasLockedTargets={hasLockedTargets}
        isRangeSelectionActive={isRangeSelectionActive}
        onClearSelectionRange={onClearSelectionRange}
        onClearLockedTargets={onClearLockedTargets}
        onLockSelectionRange={onLockSelectionRange}
        onSelectionUnitChange={onSelectionUnitChange}
        selectedCell={selectedCell}
        selectionRange={selectionRange}
        selectionUnit={selectionUnit}
        stepInBeat={selectedStepInBeat}
      />
      <ProgressionHarmonyEditor
        beatIndex={beatIndex}
        canCopyHarmonyToNext={canCopyHarmonyToNext}
        canCopyHarmonyToPrevious={canCopyHarmonyToPrevious}
        cellIndex={cellIndex}
        chordTypes={chordTypes}
        editScope={editScope}
        hasLockedTargets={hasLockedTargets}
        isRangeSelectionActive={isRangeSelectionActive}
        onBeatSelect={onSelectedBeatChange}
        onCellChange={onCellChange}
        onHarmonyCopy={onHarmonyCopy}
        onUseBeatScope={onUseBeatScope}
        onUseCellScope={onUseCellScope}
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
        onStepChange={onStepChange}
        selectedBar={selectedBar}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={beatIndex}
        selectedStepInBeat={selectedStepInBeat}
        validateRhythmPlacement={validateRhythmPlacement}
      />
    </section>
  );
}
