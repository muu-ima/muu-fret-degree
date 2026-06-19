"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LuArrowLeft, LuRedo2, LuUndo2 } from "react-icons/lu";
import theory from "../../data/theory.json";
import { useProgressionState } from "../hooks/useProgressionState";
import type { ChordType } from "../lib/music";
import { ProgressionEditor } from "./ProgressionEditor";

export function ProgressionEditorWorkspace() {
  const chordTypes = theory.chordTypes as ChordType[];
  const { canRedo, canUndo, progression, redo, undo, updateBarCount, updateCell } = useProgressionState({
    roots: theory.roots,
    chordTypes,
  });

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
    </div>
  );

  return (
    <main className="progressionWorkspace">
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
        onCellChange={updateCell}
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
      </nav>
    </main>
  );
}
