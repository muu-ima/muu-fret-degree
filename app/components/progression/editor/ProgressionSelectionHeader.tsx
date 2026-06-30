import type { ChordType } from "../../../lib/music";
import type { ProgressionCell } from "../../../lib/progression";
import { formatChordSymbol } from "../../../lib/chord-symbol";
import { ProgressionMiniTransport } from "../ProgressionMiniTransport";

type ProgressionSelectionUnit = "beat" | "cell" | "bar";
type ProgressionSelectionRange = {
  unit: ProgressionSelectionUnit;
  startSlot: number;
  endSlot: number;
};

type ProgressionSelectionHeaderProps = {
  barNumber: number;
  beatIndex: number;
  cellIndex: number;
  chordTypes: ChordType[];
  editScope: "beat" | "cell";
  onSelectionUnitChange: (unit: ProgressionSelectionUnit) => void;
  selectedCell: ProgressionCell;
  selectionRange: ProgressionSelectionRange;
  selectionUnit: ProgressionSelectionUnit;
  stepInBeat: number;
};

export function ProgressionSelectionHeader({
  barNumber,
  beatIndex,
  cellIndex,
  chordTypes,
  editScope,
  onSelectionUnitChange,
  selectedCell,
  selectionRange,
  selectionUnit,
  stepInBeat,
}: ProgressionSelectionHeaderProps) {
  const selectionCount = selectionRange.endSlot - selectionRange.startSlot + 1;
  const selectionUnitLabel = selectionUnit === "beat"
    ? "拍"
    : selectionUnit === "cell"
      ? "2拍セル"
      : "小節";
  return (
    <div className="progressionSelectionHeader">
      <div className="progressionSelectionMeta">
        <div>
          <span>Selected</span>
          <strong>
            Bar {barNumber} · Beat {beatIndex + 1}
            {stepInBeat > 0 ? ` · ${["1", "e", "&", "a"][stepInBeat]}` : ""}
          </strong>
        </div>
        <span className="progressionSelectionScope">
          {editScope === "beat"
            ? `Beat ${beatIndex + 1} override`
            : `Editing Beats ${cellIndex === 0 ? "1-2" : "3-4"}`}
        </span>
        <div className="progressionRangeMeta">
          <span>範囲選択</span>
          <div className="progressionSelectionUnitTabs" role="group" aria-label="範囲選択の単位">
            {[
              { value: "beat", label: "1拍" },
              { value: "cell", label: "2拍セル" },
              { value: "bar", label: "小節" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectionUnit === option.value ? "active" : ""}
                aria-pressed={selectionUnit === option.value}
                onClick={() => onSelectionUnitChange(option.value as ProgressionSelectionUnit)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <small>
            {selectionCount} {selectionUnitLabel}を選択中
          </small>
        </div>
        <strong className="progressionSelectionChordName">
          {formatChordSymbol(selectedCell.root, selectedCell.chordTypeId, chordTypes)}
        </strong>
      </div>
      <ProgressionMiniTransport />
    </div>
  );
}
