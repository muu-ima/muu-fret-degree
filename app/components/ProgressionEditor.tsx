"use client";

import { useEffect, useState } from "react";
import { formatChordSymbol, formatChordTypeSymbol } from "../lib/chord-symbol";
import { type ChordType } from "../lib/music";
import { type ProgressionBar, type ProgressionCell } from "../lib/progression";
import { ProgressionChordChart } from "./ProgressionChordChart";

type ProgressionEditorProps = {
  className?: string;
  bars: readonly ProgressionBar[];
  barCount: number;
  barCountOptions: number[];
  roots: string[];
  chordTypes: ChordType[];
  onBarCountChange: (barCount: number) => void;
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
};

export function ProgressionEditor({
  className = "progressionEditor",
  bars,
  barCount,
  barCountOptions,
  roots,
  chordTypes,
  onBarCountChange,
  onCellChange,
}: ProgressionEditorProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);

  useEffect(() => {
    setSelectedBarIndex((currentIndex) => Math.min(currentIndex, Math.max(bars.length - 1, 0)));
  }, [bars.length]);

  const selectBeat = (barIndex: number, beatIndex: number) => {
    setSelectedBarIndex(barIndex);
    setSelectedBeatIndex(beatIndex);
  };

  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedCellIndex = Math.floor(selectedBeatIndex / 2);
  const selectedCell = selectedBar?.cells[selectedCellIndex];

  if (!selectedBar || !selectedCell) {
    return null;
  }

  return (
    <section className={className} aria-label="コード進行編集">
      <div className="progressionEditorHeader">
        <div>
          <p className="progressionLabel">Progression Edit</p>
          <strong>{barCount}-bar loop</strong>
        </div>
        <div className="barCountTabs" role="tablist" aria-label="Bars">
          {barCountOptions.map((count) => {
            const isActive = count === barCount;
            return (
              <button
                key={count}
                type="button"
                className={isActive ? "barCountTab active" : "barCountTab"}
                aria-pressed={isActive}
                onClick={() => onBarCountChange(count)}
              >
                {count} bars
              </button>
            );
          })}
        </div>
      </div>
      <ProgressionChordChart
        bars={bars}
        chordTypes={chordTypes}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        onBeatSelect={selectBeat}
      />
      <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
        <div className="progressionSelectionHeader">
          <div>
            <span>Selected</span>
            <strong>
              Bar {selectedBar.bar} · Beat {selectedBeatIndex + 1}
            </strong>
          </div>
          <div className="progressionSelectionChord">
            <strong>{formatChordSymbol(selectedCell.root, selectedCell.chordTypeId, chordTypes)}</strong>
            <span>Editing Beats {selectedCellIndex === 0 ? "1-2" : "3-4"}</span>
          </div>
        </div>

        <div className="progressionBeatTabs" role="tablist" aria-label="編集する拍">
          {[0, 1, 2, 3].map((beatIndex) => {
            const isSelected = selectedBeatIndex === beatIndex;
            return (
              <button
                key={beatIndex}
                type="button"
                className={isSelected ? "active" : ""}
                aria-selected={isSelected}
                role="tab"
                onClick={() => selectBeat(selectedBarIndex, beatIndex)}
              >
                Beat {beatIndex + 1}
              </button>
            );
          })}
        </div>

        <div className="progressionChipSection">
          <span className="controlLabel">Root</span>
          <div className="progressionChipGrid progressionRootChips" role="group" aria-label="Root">
            {roots.map((root) => {
              const isSelected = selectedCell.root === root;
              return (
                <button
                  key={root}
                  type="button"
                  className={isSelected ? "progressionChip active" : "progressionChip"}
                  aria-pressed={isSelected}
                  onClick={() => onCellChange(selectedBarIndex, selectedCellIndex, { ...selectedCell, root })}
                >
                  {root}
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionChipSection">
          <span className="controlLabel">Chord</span>
          <div className="progressionChipGrid progressionChordChips" role="group" aria-label="Chord">
            {chordTypes.map((chordType) => {
              const isSelected = selectedCell.chordTypeId === chordType.id;
              return (
                <button
                  key={chordType.id}
                  type="button"
                  className={isSelected ? "progressionChip active" : "progressionChip"}
                  aria-pressed={isSelected}
                  title={chordType.name}
                  onClick={() =>
                    onCellChange(selectedBarIndex, selectedCellIndex, {
                      ...selectedCell,
                      chordTypeId: chordType.id,
                    })
                  }
                >
                  {formatChordTypeSymbol(chordType.id, chordTypes)}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
