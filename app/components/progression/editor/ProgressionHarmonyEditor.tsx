import { formatChordTypeSymbol } from "../../../lib/chord-symbol";
import type { ChordType } from "../../../lib/music";
import type { ProgressionCell } from "../../../lib/progression";
import { EditorCombobox } from "../../ui/EditorCombobox";

type ProgressionHarmonyEditorProps = {
  beatIndex: number;
  cellIndex: number;
  chordTypes: ChordType[];
  editScope: "beat" | "cell";
  onBeatSelect: (beatIndex: number) => void;
  onCellChange: (cell: ProgressionCell) => void;
  onUseBeatScope: () => void;
  onUseCellScope: () => void;
  roots: readonly string[];
  selectedCell: ProgressionCell;
};

export function ProgressionHarmonyEditor({
  beatIndex,
  cellIndex,
  chordTypes,
  editScope,
  onBeatSelect,
  onCellChange,
  onUseBeatScope,
  onUseCellScope,
  roots,
  selectedCell,
}: ProgressionHarmonyEditorProps) {
  return (
    <section className="progressionHarmonySection" aria-label="Harmony">
      <div className="progressionHarmonyFields">
        <div className="progressionChipSection">
          <span className="controlLabel">Root</span>
          <EditorCombobox
            ariaLabel="Root"
            searchPlaceholder="ルートを検索…"
            value={selectedCell.root}
            options={roots.map((root) => ({ value: root, label: root }))}
            onValueChange={(root) => onCellChange({ ...selectedCell, root })}
          />
        </div>

        <div className="progressionChipSection">
          <span className="controlLabel">Chord</span>
          <EditorCombobox
            ariaLabel="Chord"
            searchPlaceholder="コードタイプを検索…"
            value={selectedCell.chordTypeId}
            options={chordTypes.map((chordType) => ({
              value: chordType.id,
              label: formatChordTypeSymbol(chordType.id, chordTypes),
              description: chordType.name,
            }))}
            onValueChange={(chordTypeId) =>
              onCellChange({ ...selectedCell, chordTypeId })
            }
          />
        </div>
      </div>

      <div className="progressionHarmonyMetaFields">
        <div className="progressionApplySection">
          <span className="controlLabel">Apply To</span>
          <div className="progressionApplyTabs" role="group" aria-label="コードの適用範囲">
            <button
              type="button"
              className={editScope === "cell" ? "active" : ""}
              aria-pressed={editScope === "cell"}
              onClick={onUseCellScope}
            >
              Beats {cellIndex === 0 ? "1-2" : "3-4"}
            </button>
            <button
              type="button"
              className={editScope === "beat" ? "active" : ""}
              aria-pressed={editScope === "beat"}
              onClick={onUseBeatScope}
            >
              Beat {beatIndex + 1} only
            </button>
          </div>
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Beat</span>
          <div className="progressionBeatTabs" role="tablist" aria-label="編集する拍">
            {[0, 1, 2, 3].map((nextBeatIndex) => {
              const isSelected = beatIndex === nextBeatIndex;
              return (
                <button
                  key={nextBeatIndex}
                  type="button"
                  className={isSelected ? "active" : ""}
                  aria-selected={isSelected}
                  role="tab"
                  onClick={() => onBeatSelect(nextBeatIndex)}
                >
                  Beat {nextBeatIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
