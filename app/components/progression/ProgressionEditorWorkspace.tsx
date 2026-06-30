"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuRedo2, LuRotateCcw, LuUndo2 } from "react-icons/lu";
import theory from "../../../data/theory.json";
import type { ChordType } from "../../lib/music";
import { useProgressionSession } from "../../providers/ProgressionSessionProvider";
import { ProgressionEditor } from "./ProgressionEditor";

export function ProgressionEditorWorkspace() {
  const chordTypes = theory.chordTypes as ChordType[];
  const {
    applyRhythmPreset,
    canRedo,
    canUndo,
    progression,
    redo,
    resetProgression,
    removeRhythmEvent,
    undo,
    updateBarCount,
    updateBeatChord,
    updateBeatDuration,
    updateBeatEventType,
    updateCell,
    updateHarmonyTargets,
    updateRhythmEvent,
    validateRhythmPlacement,
  } = useProgressionSession();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [contenteditable='true']")) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (key === "z") {
        event.preventDefault();
        undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [redo, undo]);

  useEffect(() => {
    if (!isResetDialogOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsResetDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isResetDialogOpen]);

  const openResetDialog = () => setIsResetDialogOpen(true);
  const closeResetDialog = () => setIsResetDialogOpen(false);
  const confirmResetProgression = () => {
    resetProgression();
    closeResetDialog();
  };

  const historyButtons = (
    <div className="progressionHistoryActions" role="group" aria-label="編集履歴">
      <button type="button" aria-label="元に戻す" title="元に戻す (Ctrl/Cmd + Z)" disabled={!canUndo} onClick={undo}>
        <LuUndo2 aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="やり直す"
        title="やり直す (Ctrl/Cmd + Shift + Z)"
        disabled={!canRedo}
        onClick={redo}
      >
        <LuRedo2 aria-hidden="true" />
      </button>
      <button
        type="button"
        className="progressionResetButton"
        aria-label="編集をリセット"
        title="編集をリセット"
        onClick={openResetDialog}
      >
        <LuRotateCcw aria-hidden="true" />
        <span>Reset</span>
      </button>
    </div>
  );

  return (
    <main className="progressionWorkspace">
      {isResetDialogOpen ? (
        <div className="progressionResetDialogBackdrop" onClick={closeResetDialog}>
          <section
            className="progressionResetDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progression-reset-title"
            aria-describedby="progression-reset-description"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Confirm Reset</p>
            <h2 id="progression-reset-title">Reset Progression Edit?</h2>
            <p id="progression-reset-description">
              現在の Progression Edit を初期状態へ戻します。あとから Undo で元に戻せます。
            </p>
            <div className="progressionResetDialogActions">
              <button type="button" onClick={closeResetDialog}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmResetProgression}>
                Reset
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <header className="progressionWorkspaceHeader">
        <div>
          <p className="eyebrow">Full Editor</p>
          <h1>Progression Edit</h1>
          <p>コード譜を見ながら、小節と拍の流れを組み立てます。</p>
        </div>
        <div className="progressionWorkspaceActions">
          {historyButtons}
          <Link className="progressionWorkspaceBack" href="/">
            <LuArrowLeft aria-hidden="true" />
            Practice
          </Link>
        </div>
      </header>

      <ProgressionEditor
        className="progressionEditor progressionEditorFull"
        bars={progression.bars}
        barCount={progression.bars.length}
        barCountOptions={[2, 4, 8, 16]}
        roots={theory.roots}
        chordTypes={chordTypes}
        onBarCountChange={updateBarCount}
        onRhythmPresetApply={applyRhythmPreset}
        onBeatChordChange={updateBeatChord}
        onBeatDurationChange={updateBeatDuration}
        onBeatEventTypeChange={updateBeatEventType}
        onCellChange={updateCell}
        onHarmonyTargetsChange={updateHarmonyTargets}
        onRhythmEventChange={updateRhythmEvent}
        onRhythmEventRemove={removeRhythmEvent}
        validateRhythmPlacement={validateRhythmPlacement}
      />

      <nav className="progressionEditorMobileBar" aria-label="編集操作">
        <Link href="/">
          <LuArrowLeft aria-hidden="true" />
          <span>Practice</span>
        </Link>
        <button type="button" disabled={!canUndo} onClick={undo}>
          <LuUndo2 aria-hidden="true" />
          <span>Undo</span>
        </button>
        <button type="button" disabled={!canRedo} onClick={redo}>
          <LuRedo2 aria-hidden="true" />
          <span>Redo</span>
        </button>
        <button type="button" onClick={openResetDialog}>
          <LuRotateCcw aria-hidden="true" />
          <span>Reset</span>
        </button>
      </nav>
    </main>
  );
}
