"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuArrowRight, LuExternalLink } from "react-icons/lu";
import type { ChordType } from "../../lib/music";
import type { ProgressionBar, ProgressionCell } from "../../lib/progression";

type ProgressionQuickEditorProps = {
  bars: readonly ProgressionBar[];
  roots: string[];
  chordTypes: ChordType[];
  activeBarIndex: number;
  activeCellIndex: number;
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
};

export function ProgressionQuickEditor({
  bars,
  roots,
  chordTypes,
  activeBarIndex,
  activeCellIndex,
  onCellChange,
}: ProgressionQuickEditorProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(activeBarIndex);
  const [selectedCellIndex, setSelectedCellIndex] = useState(activeCellIndex);

  useEffect(() => {
    setSelectedBarIndex(Math.min(activeBarIndex, Math.max(bars.length - 1, 0)));
    setSelectedCellIndex(activeCellIndex);
  }, [activeBarIndex, activeCellIndex, bars.length]);

  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedCell = selectedBar?.cells[selectedCellIndex];
  const selectAdjacentBar = (direction: -1 | 1) => {
    if (bars.length === 0) {
      return;
    }

    setSelectedBarIndex((currentIndex) => (currentIndex + direction + bars.length) % bars.length);
  };

  if (!selectedBar || !selectedCell) {
    return null;
  }

  return (
    <section className="progressionQuickEditor" aria-label="選択中のコードを編集">
      <div className="quickEditorBarNav">
        <button type="button" aria-label="前の小節" onClick={() => selectAdjacentBar(-1)}>
          <LuArrowLeft aria-hidden="true" />
        </button>
        <div>
          <span>Selected Bar</span>
          <strong>Bar {selectedBar.bar}</strong>
        </div>
        <button type="button" aria-label="次の小節" onClick={() => selectAdjacentBar(1)}>
          <LuArrowRight aria-hidden="true" />
        </button>
      </div>

      <div className="quickEditorCellTabs" role="group" aria-label="編集する2拍セル">
        {[0, 1].map((cellIndex) => {
          const isSelected = selectedCellIndex === cellIndex;
          return (
            <button
              key={cellIndex}
              type="button"
              className={isSelected ? "active" : ""}
              aria-pressed={isSelected}
              onClick={() => setSelectedCellIndex(cellIndex)}
            >
              Beats {cellIndex === 0 ? "1-2" : "3-4"}
            </button>
          );
        })}
      </div>

      <div className="quickEditorFields">
        <label>
          Root
          <select
            value={selectedCell.root}
            onChange={(event) =>
              onCellChange(selectedBarIndex, selectedCellIndex, {
                ...selectedCell,
                root: event.target.value,
              })
            }
          >
            {roots.map((root) => (
              <option key={root} value={root}>
                {root}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chord
          <select
            value={selectedCell.chordTypeId}
            onChange={(event) =>
              onCellChange(selectedBarIndex, selectedCellIndex, {
                ...selectedCell,
                chordTypeId: event.target.value,
              })
            }
          >
            {chordTypes.map((chordType) => (
              <option key={chordType.id} value={chordType.id}>
                {chordType.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Link className="quickEditorFullLink" href="/progression">
        <LuExternalLink aria-hidden="true" />
        Full Editor
      </Link>
    </section>
  );
}
