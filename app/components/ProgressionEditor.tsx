"use client";

import { type ChordType } from "../lib/music";
import { type ProgressionBar, type ProgressionCell } from "../lib/progression";

type ProgressionEditorProps = {
  bars: readonly ProgressionBar[];
  barCount: number;
  barCountOptions: number[];
  roots: string[];
  chordTypes: ChordType[];
  onBarCountChange: (barCount: number) => void;
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
};

export function ProgressionEditor({
  bars,
  barCount,
  barCountOptions,
  roots,
  chordTypes,
  onBarCountChange,
  onCellChange,
}: ProgressionEditorProps) {
  return (
    <section className="progressionEditor" aria-label="コード進行編集">
      <div className="progressionEditorHeader">
        <div>
          <p className="progressionLabel">Progression Edit</p>
          <strong>{barCount}-bar loop</strong>
        </div>
        <label className="progressionBarCount">
          Bars
          <select value={barCount} onChange={(event) => onBarCountChange(Number(event.target.value))}>
            {barCountOptions.map((count) => (
              <option key={count} value={count}>
                {count} bars
              </option>
            ))}
          </select>
        </label>
      </div>
      <span className="progressionEditorHint">Root と Chord をその場で書き換えられます。</span>
      <div className="progressionEditorGrid">
        {bars.map((bar, barIndex) => (
          <div className="progressionEditorRow" key={bar.bar}>
            <strong>Bar {bar.bar}</strong>
            {bar.cells.map((cell, cellIndex) => (
              <div className="progressionCellGroup" key={`${bar.bar}-${cellIndex}`}>
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
