"use client";

import { type ProgressionBar, type ProgressionPosition } from "../lib/progression";

type ProgressionPanelProps = {
  currentProgressionBar?: ProgressionBar;
  currentProgressionChordTypeName?: string;
  progressionPosition: ProgressionPosition;
  isProgressionRunning: boolean;
  onStartProgression: () => void;
  onStopProgression: () => void;
  onResetProgression: () => void;
};

export function ProgressionPanel({
  currentProgressionBar,
  currentProgressionChordTypeName,
  progressionPosition,
  isProgressionRunning,
  onStartProgression,
  onStopProgression,
  onResetProgression,
}: ProgressionPanelProps) {
  const currentBarNumber = currentProgressionBar?.bar ?? progressionPosition.barIndex + 1;

  return (
    <section className="progressionPanel" aria-label="コード進行再生">
      <div className="progressionMeta">
        <p className="progressionLabel">Progression</p>
        <strong>
          Bar {currentBarNumber}, Beat {progressionPosition.beatInBar + 1}
        </strong>
        <span>
          {currentProgressionBar
            ? `${currentProgressionBar.root} ${currentProgressionChordTypeName ?? currentProgressionBar.chordTypeId}`
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
