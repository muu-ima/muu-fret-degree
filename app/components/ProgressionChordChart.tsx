"use client";

import type { ChordType } from "../lib/music";
import { formatChordSymbol } from "../lib/chord-symbol";
import {
  getProgressionBeatEventType,
  getProgressionCellForBeat,
  type ProgressionBar,
} from "../lib/progression";

type ProgressionChordChartProps = {
  bars: readonly ProgressionBar[];
  chordTypes: ChordType[];
  selectedBarIndex: number;
  selectedBeatIndex: number;
  onBeatSelect: (barIndex: number, beatIndex: number) => void;
};

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
          const beatSymbols = [0, 1, 2, 3].map((beatIndex) => {
            const cell = getProgressionCellForBeat(bar, beatIndex);
            return formatChordSymbol(cell.root, cell.chordTypeId, chordTypes);
          });

          return (
            <article
              className={barIndex === selectedBarIndex ? "progressionChartBar selected" : "progressionChartBar"}
              key={bar.bar}
            >
              <span className="progressionChartBarNumber">Bar {bar.bar}</span>
              <div className="progressionChartChords">
                {beatSymbols.map((symbol, beatIndex) => (
                  <strong className="progressionChartChord" key={beatIndex}>
                    {beatIndex === 0 || symbol !== beatSymbols[beatIndex - 1] ? symbol : ""}
                  </strong>
                ))}
              </div>
              <div className="progressionChartBeats">
                {[0, 1, 2, 3].map((beatIndex) => {
                  const isSelected = barIndex === selectedBarIndex && beatIndex === selectedBeatIndex;
                  const cell = getProgressionCellForBeat(bar, beatIndex);
                  const eventType = getProgressionBeatEventType(bar, beatIndex);
                  return (
                    <button
                      key={beatIndex}
                      type="button"
                      className={`progressionChartBeat${eventType === "rest" ? " rest" : ""}${isSelected ? " selected" : ""}`}
                      aria-label={`Bar ${bar.bar}, Beat ${beatIndex + 1}, ${formatChordSymbol(cell.root, cell.chordTypeId, chordTypes)}, ${eventType === "rest" ? "Rest" : "Hit"}`}
                      aria-pressed={isSelected}
                      onClick={() => onBeatSelect(barIndex, beatIndex)}
                    >
                      <span className="progressionChartSlash" aria-hidden="true">
                        {eventType === "rest" ? "—" : "/"}
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
