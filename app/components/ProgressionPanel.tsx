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
  const progressLabel = `Bar ${currentBarNumber} • ${currentCellLabel}`;
  const modeLabel = isProgressionRunning ? "Playing" : "Stopped";

  return (
    <section className="progressionPanel" aria-label="コード進行再生">
      <div className="progressionMeta">
        <div className="progressionLabelRow">
          <p className="progressionLabel">Progression</p>
          <span className="progressionStatus">{modeLabel}</span>
        </div>
        <strong>{progressLabel}</strong>
        <span>
          {currentProgressionBar && currentProgressionCell
            ? `${currentProgressionCell.root} ${currentProgressionChordTypeName ?? currentProgressionCell.chordTypeId}`
            : "No bars"}
        </span>
        <div className="progressionReadout" aria-label="progress readout">
          <span>Beat {progressionPosition.beatIndex + 1}</span>
          <span>{progressionPosition.elapsedSeconds.toFixed(1)}s</span>
        </div>
      </div>
      <div className="progressionButtons">
        <button type="button" className="actionButton actionButtonPrimary" onClick={onStartProgression} disabled={isProgressionRunning}>
          <span aria-hidden="true">▶</span>
          Play
        </button>
        <button type="button" className="actionButton" onClick={onStopProgression} disabled={!isProgressionRunning}>
          <span aria-hidden="true">■</span>
          Stop
        </button>
        <button type="button" className="actionButton" onClick={onResetProgression}>
          <span aria-hidden="true">↺</span>
          Reset
        </button>
      </div>
    </section>
  );
}
