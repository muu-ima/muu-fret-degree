"use client";

import { type ProgressionBar, type ProgressionCell, type ProgressionPosition } from "../lib/progression";
import type { ProgressionRhythm } from "../lib/progression-playback";

type ProgressionPanelProps = {
  currentProgressionBar?: ProgressionBar;
  currentProgressionCell?: ProgressionCell;
  currentProgressionCellIndex?: number;
  currentProgressionChordTypeName?: string;
  progressionPosition: ProgressionPosition;
  isProgressionCountingIn: boolean;
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
  isProgressionCountingIn,
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
  const isProgressionActive = isProgressionCountingIn || isProgressionRunning;
  const modeLabel = isProgressionCountingIn
    ? "Count-in"
    : isProgressionRunning
      ? "Playing"
      : "Stopped";
  const rhythmOptions: { value: ProgressionRhythm; label: string }[] = [
    { value: "root-only", label: "Root Only" },
    { value: "chord-tones", label: "Chord Tones" },
    { value: "degree-ascending", label: "1 - 3 - 5 - 7" },
    { value: "degree-third-first", label: "3 - 1 - 5 - 7" },
    { value: "four-beat", label: "4 Beat" },
  ];

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
        <button type="button" className="actionButton actionButtonPrimary" onClick={onStartProgression} disabled={isProgressionActive}>
          <span aria-hidden="true">▶</span>
          Play
        </button>
        <button type="button" className="actionButton" onClick={onStopProgression} disabled={!isProgressionActive}>
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
          {rhythmOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={rhythm === option.value ? "progressionRhythmTab active" : "progressionRhythmTab"}
              aria-pressed={rhythm === option.value}
              onClick={() => onRhythmChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
