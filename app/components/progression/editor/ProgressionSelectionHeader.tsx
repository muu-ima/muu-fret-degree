import type { ChordType } from "../../../lib/music";
import type { ProgressionCell } from "../../../lib/progression";
import { formatChordSymbol } from "../../../lib/chord-symbol";
import { ProgressionMiniTransport } from "../ProgressionMiniTransport";

type ProgressionSelectionHeaderProps = {
  barNumber: number;
  beatIndex: number;
  cellIndex: number;
  chordTypes: ChordType[];
  editScope: "beat" | "cell";
  selectedCell: ProgressionCell;
  stepInBeat: number;
};

export function ProgressionSelectionHeader({
  barNumber,
  beatIndex,
  cellIndex,
  chordTypes,
  editScope,
  selectedCell,
  stepInBeat,
}: ProgressionSelectionHeaderProps) {
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
        <strong className="progressionSelectionChordName">
          {formatChordSymbol(selectedCell.root, selectedCell.chordTypeId, chordTypes)}
        </strong>
      </div>
      <ProgressionMiniTransport />
    </div>
  );
}
