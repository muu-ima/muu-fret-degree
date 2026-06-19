"use client";

import { useEffect, useState } from "react";
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
      <span className="progressionEditorHint">Root と Chord をその場で書き換えられます。</span>
      <ProgressionChordChart
        bars={bars}
        chordTypes={chordTypes}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        onBeatSelect={selectBeat}
      />
      <div className="progressionEditorGrid">
        {bars.map((bar, barIndex) => (
          <div
            className={barIndex === selectedBarIndex ? "progressionEditorRow selected" : "progressionEditorRow"}
            key={bar.bar}
          >
            <strong>Bar {bar.bar}</strong>
            {bar.cells.map((cell, cellIndex) => (
              <div
                className={
                  barIndex === selectedBarIndex && cellIndex === Math.floor(selectedBeatIndex / 2)
                    ? "progressionCellGroup selected"
                    : "progressionCellGroup"
                }
                key={`${bar.bar}-${cellIndex}`}
                onClick={() => selectBeat(barIndex, cellIndex * 2)}
              >
                <strong className="progressionCellTitle">
                  Beats {cellIndex === 0 ? "1-2" : "3-4"}
                </strong>
                <label>
                  Root
                  <select
                    value={cell.root}
                    onChange={(event) =>
                      onCellChange(barIndex, cellIndex, {
                        ...cell,
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
                    value={cell.chordTypeId}
                    onChange={(event) =>
                      onCellChange(barIndex, cellIndex, {
                        ...cell,
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
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
