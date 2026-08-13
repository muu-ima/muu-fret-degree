import { LuRedo2, LuRotateCcw, LuUndo2 } from "react-icons/lu";

type ProgressionHistoryActionsProps = {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onReset: () => void;
  onUndo: () => void;
};

export function ProgressionHistoryActions({
  canRedo,
  canUndo,
  onRedo,
  onReset,
  onUndo,
}: ProgressionHistoryActionsProps) {
  return (
    <div className="progressionHistoryActions" role="group" aria-label="編集履歴">
      <button
        type="button"
        aria-label="元に戻す"
        title="元に戻す (Ctrl/Cmd + Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <LuUndo2 aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="やり直す"
        title="やり直す (Ctrl/Cmd + Shift + Z)"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <LuRedo2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className="progressionResetButton"
        aria-label="編集をリセット"
        title="編集をリセット"
        onClick={onReset}
      >
        <LuRotateCcw aria-hidden="true" />
        <span>Reset</span>
      </button>
    </div>
  );
}
