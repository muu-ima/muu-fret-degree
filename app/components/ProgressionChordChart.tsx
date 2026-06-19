"use client";

import type { ChordType } from "../lib/music";
import type { ProgressionBar } from "../lib/progression";

type ProgressionChordChartProps = {
  bars: readonly ProgressionBar[];
  chordTypes: ChordType[];
  selectedBarIndex: number;
  selectedBeatIndex: number;
  onBeatSelect: (barIndex: number, beatIndex: number) => void;
};

const chordSuffixes: Record<string, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  maj7: "maj7",
  "7": "7",
  m7: "m7",
  m7b5: "m7b5",
  dim7: "dim7",
  sus4: "sus4",
  "6": "6",
  m6: "m6",
};

function chordSymbol(root: string, chordTypeId: string, chordTypes: ChordType[]) {
  const suffix = chordSuffixes[chordTypeId];
  if (suffix !== undefined) {
    return `${root}${suffix}`;
  }

  const chordType = chordTypes.find((item) => item.id === chordTypeId);
  return `${root} ${chordType?.name ?? chordTypeId}`;
}

export function ProgressionChordChart({
  bars,
  chordTypes,
  selectedBarIndex,
  selectedBeatIndex,
  onBeatSelect,
}: ProgressionChordChartProps) {
  return (
    <section className="progressionChordChart" aria-label="コード進行譜">
      <div className="progressionChordChartHeader">
        <span>Chord Chart</span>
        <strong>
          Bar {bars[selectedBarIndex]?.bar ?? 1} · Beat {selectedBeatIndex + 1}
        </strong>
      </div>
      <div className="progressionChordChartGrid">
        {bars.map((bar, barIndex) => {
          const firstSymbol = chordSymbol(bar.cells[0].root, bar.cells[0].chordTypeId, chordTypes);
          const secondSymbol = chordSymbol(bar.cells[1].root, bar.cells[1].chordTypeId, chordTypes);
          const usesSingleChord = firstSymbol === secondSymbol;

          return (
            <article
              className={barIndex === selectedBarIndex ? "progressionChartBar selected" : "progressionChartBar"}
              key={bar.bar}
            >
              <span className="progressionChartBarNumber">Bar {bar.bar}</span>
              <div className="progressionChartChords">
                <strong className={usesSingleChord ? "progressionChartChord full" : "progressionChartChord"}>
                  {firstSymbol}
                </strong>
                {!usesSingleChord && <strong className="progressionChartChord">{secondSymbol}</strong>}
              </div>
              <div className="progressionChartBeats">
                {[0, 1, 2, 3].map((beatIndex) => {
                  const isSelected = barIndex === selectedBarIndex && beatIndex === selectedBeatIndex;
                  return (
                    <button
                      key={beatIndex}
                      type="button"
                      className={isSelected ? "progressionChartBeat selected" : "progressionChartBeat"}
                      aria-label={`Bar ${bar.bar}, Beat ${beatIndex + 1}`}
                      aria-pressed={isSelected}
                      onClick={() => onBeatSelect(barIndex, beatIndex)}
                    >
                      <span className="progressionChartSlash" aria-hidden="true">
                        /
                      </span>
                      <span className="progressionChartBeatNumber" aria-hidden="true">
                        {beatIndex + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
