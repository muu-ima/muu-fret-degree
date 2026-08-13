import Link from "next/link";
import { LuArrowLeft, LuRedo2, LuRotateCcw, LuUndo2 } from "react-icons/lu";

type ProgressionEditorMobileBarProps = {
  canRedo: boolean;
  canUndo: boolean;
  onRedo: () => void;
  onReset: () => void;
  onUndo: () => void;
};

export function ProgressionEditorMobileBar({
  canRedo,
  canUndo,
  onRedo,
  onReset,
  onUndo,
}: ProgressionEditorMobileBarProps) {
  return (
    <nav className="progressionEditorMobileBar" aria-label="編集操作">
      <Link href="/">
        <LuArrowLeft aria-hidden="true" />
        <span>Practice</span>
      </Link>
      <button type="button" disabled={!canUndo} onClick={onUndo}>
        <LuUndo2 aria-hidden="true" />
        <span>Undo</span>
      </button>
      <button type="button" disabled={!canRedo} onClick={onRedo}>
        <LuRedo2 aria-hidden="true" />
        <span>Redo</span>
      </button>
      <button type="button" onClick={onReset}>
        <LuRotateCcw aria-hidden="true" />
        <span>Reset</span>
      </button>
    </nav>
  );
}
