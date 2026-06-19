"use client";

import { useEffect, useState } from "react";
import { formatChordSymbol, formatChordTypeSymbol } from "../lib/chord-symbol";
import { type ChordType } from "../lib/music";
import {
  canTieProgressionBeat,
  getProgressionBeatEventType,
  getProgressionCellForBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
} from "../lib/progression";
import { ProgressionChordChart } from "./ProgressionChordChart";

type ProgressionEditorProps = {
  className?: string;
  bars: readonly ProgressionBar[];
  barCount: number;
  barCountOptions: number[];
  roots: string[];
  chordTypes: ChordType[];
  onBarCountChange: (barCount: number) => void;
  onBeatChordChange: (barIndex: number, beatIndex: number, cell: ProgressionCell | undefined) => void;
  onBeatEventTypeChange: (
    barIndex: number,
    beatIndex: number,
    eventType: ProgressionBeatEventType,
  ) => void;
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
  onBeatChordChange,
  onBeatEventTypeChange,
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
  const baseCell = selectedBar?.cells[selectedCellIndex];
  const beatOverride = selectedBar?.beats?.[selectedBeatIndex]?.chordOverride;
  const selectedBeatEventType = selectedBar
    ? getProgressionBeatEventType(selectedBar, selectedBeatIndex)
    : "hit";
  const canTieSelectedBeat = canTieProgressionBeat(
    bars,
    selectedBarIndex,
    selectedBeatIndex,
  );
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
            <span>
              {editScope === "beat"
                ? `Beat ${selectedBeatIndex + 1} override`
                : `Editing Beats ${selectedCellIndex === 0 ? "1-2" : "3-4"}`}
            </span>
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

        <div className="progressionApplySection">
          <span className="controlLabel">Beat Event</span>
          <div
            className="progressionApplyTabs progressionEventTabs"
            role="group"
            aria-label="拍の発音状態"
          >
            {(["hit", "rest", "tie"] as const).map((eventType) => {
              const isActive = selectedBeatEventType === eventType;
              const isDisabled = eventType === "tie" && !canTieSelectedBeat;
              return (
                <button
                  key={eventType}
                  type="button"
                  className={isActive ? "active" : ""}
                  aria-pressed={isActive}
                  disabled={isDisabled}
                  title={isDisabled ? "Tieには直前のHitが必要です" : undefined}
                  onClick={() =>
                    onBeatEventTypeChange(selectedBarIndex, selectedBeatIndex, eventType)
                  }
                >
                  {eventType === "hit" ? "Hit" : eventType === "rest" ? "Rest" : "Tie"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Apply To</span>
          <div className="progressionApplyTabs" role="group" aria-label="コードの適用範囲">
            <button
              type="button"
              className={editScope === "cell" ? "active" : ""}
              aria-pressed={editScope === "cell"}
              onClick={useCellScope}
            >
              Beats {selectedCellIndex === 0 ? "1-2" : "3-4"}
            </button>
            <button
              type="button"
              className={editScope === "beat" ? "active" : ""}
              aria-pressed={editScope === "beat"}
              onClick={useBeatScope}
            >
              Beat {selectedBeatIndex + 1} only
            </button>
          </div>
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
                  onClick={() => applyCellChange({ ...selectedCell, root })}
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
                    applyCellChange({
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
