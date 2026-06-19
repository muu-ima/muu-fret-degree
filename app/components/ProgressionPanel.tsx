"use client";

import { type ProgressionRhythm } from "../hooks/useChordPlayback";
import { type ProgressionBar, type ProgressionCell, type ProgressionPosition } from "../lib/progression";

type ProgressionPanelProps = {
  currentProgressionBar?: ProgressionBar;
  currentProgressionCell?: ProgressionCell;
  currentProgressionCellIndex?: number;
  currentProgressionChordTypeName?: string;
  progressionPosition: ProgressionPosition;
  isProgressionRunning: boolean;
  rhythm: ProgressionRhythm;
  onStartProgression: () => void;
  onStopProgression: () => void;
  onResetProgression: () => void;
  onRhythmChange: (rhythm: ProgressionRhythm) => void;
};

export function ProgressionPanel({
  currentProgressionBar,
  currentProgressionCell,
  currentProgressionCellIndex,
  currentProgressionChordTypeName,
  progressionPosition,
  isProgressionRunning,
  rhythm,
  onStartProgression,
  onStopProgression,
  onResetProgression,
  onRhythmChange,
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
      <div className="progressionRhythm">
        <span className="controlLabel">Rhythm</span>
        <div className="progressionRhythmTabs" role="group" aria-label="ベース伴奏リズム">
          <button
            type="button"
            className={rhythm === "chord-tones" ? "progressionRhythmTab active" : "progressionRhythmTab"}
            aria-pressed={rhythm === "chord-tones"}
            onClick={() => onRhythmChange("chord-tones")}
          >
            Chord Tones
          </button>
          <button
            type="button"
            className={rhythm === "four-beat" ? "progressionRhythmTab active" : "progressionRhythmTab"}
            aria-pressed={rhythm === "four-beat"}
            onClick={() => onRhythmChange("four-beat")}
          >
            4 Beat
          </button>
        </div>
      </div>
    </section>
  );
}
