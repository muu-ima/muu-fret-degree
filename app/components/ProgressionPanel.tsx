"use client";

import { type ProgressionBar, type ProgressionCell, type ProgressionPosition } from "../lib/progression";

type ProgressionPanelProps = {
  currentProgressionBar?: ProgressionBar;
  currentProgressionCell?: ProgressionCell;
  currentProgressionCellIndex?: number;
  currentProgressionChordTypeName?: string;
  progressionPosition: ProgressionPosition;
  isProgressionRunning: boolean;
  onStartProgression: () => void;
  onStopProgression: () => void;
  onResetProgression: () => void;
};

export function ProgressionPanel({
  currentProgressionBar,
  currentProgressionCell,
  currentProgressionCellIndex,
  currentProgressionChordTypeName,
  progressionPosition,
  isProgressionRunning,
  onStartProgression,
  onStopProgression,
  onResetProgression,
}: ProgressionPanelProps) {
  const currentBarNumber = currentProgressionBar?.bar ?? progressionPosition.barIndex + 1;
  const currentCellIndex = currentProgressionCellIndex ?? Math.min(Math.floor(progressionPosition.beatInBar / 2), 1);
  const currentCellLabel = currentCellIndex === 0 ? "Beats 1-2" : "Beats 3-4";

  return (
    <section className="progressionPanel" aria-label="コード進行再生">
      <div className="progressionMeta">
        <p className="progressionLabel">Progression</p>
        <strong>
          Bar {currentBarNumber}, {currentCellLabel}
        </strong>
        <span>
          {currentProgressionBar && currentProgressionCell
            ? `${currentProgressionCell.root} ${currentProgressionChordTypeName ?? currentProgressionCell.chordTypeId}`
            : "No bars"}
        </span>
      </div>
      <div className="progressionButtons">
        <button type="button" onClick={onStartProgression} disabled={isProgressionRunning}>
          Play
        </button>
        <button type="button" className="secondaryButton" onClick={onStopProgression} disabled={!isProgressionRunning}>
          Stop
        </button>
        <button type="button" className="secondaryButton" onClick={onResetProgression}>
          Reset
        </button>
      </div>
    </section>
  );
}
