"use client";

import { type ChordType } from "../lib/music";
import { type ProgressionBar } from "../lib/progression";

type ProgressionEditorProps = {
  bars: readonly ProgressionBar[];
  roots: string[];
  chordTypes: ChordType[];
  onBarChange: (barIndex: number, bar: ProgressionBar) => void;
};

export function ProgressionEditor({ bars, roots, chordTypes, onBarChange }: ProgressionEditorProps) {
  return (
    <section className="progressionEditor" aria-label="コード進行編集">
      <div className="progressionEditorHeader">
        <div>
          <p className="progressionLabel">Progression Edit</p>
          <strong>4-bar starter loop</strong>
        </div>
        <span>Root と Chord をその場で書き換えられます。</span>
      </div>
      <div className="progressionEditorGrid">
        {bars.map((bar, barIndex) => (
          <div className="progressionEditorRow" key={bar.bar}>
            <strong>Bar {bar.bar}</strong>
            <label>
              Root
              <select
                value={bar.root}
                onChange={(event) =>
                  onBarChange(barIndex, {
                    ...bar,
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
                value={bar.chordTypeId}
                onChange={(event) =>
                  onBarChange(barIndex, {
                    ...bar,
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
    </section>
  );
}
