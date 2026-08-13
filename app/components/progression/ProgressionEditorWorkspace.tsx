"use client";

import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import theory from "../../../data/theory.json";
import type { ChordType } from "../../lib/music";
import { useProgressionWorkspaceActions } from "../../hooks/progression/useProgressionWorkspaceActions";
import { useProgressionSession } from "../../providers/ProgressionSessionProvider";
import { ProgressionEditor } from "./ProgressionEditor";
import { ProgressionEditorMobileBar } from "./editor/ProgressionEditorMobileBar";
import { ProgressionHistoryActions } from "./editor/ProgressionHistoryActions";
import { ProgressionResetDialog } from "./editor/ProgressionResetDialog";

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
  const {
    closeResetDialog,
    confirmResetProgression,
    isResetDialogOpen,
    openResetDialog,
  } = useProgressionWorkspaceActions({
    onRedo: redo,
    onReset: resetProgression,
    onUndo: undo,
  });

  return (
    <main className="progressionWorkspace">
      {isResetDialogOpen ? (
        <ProgressionResetDialog
          onCancel={closeResetDialog}
          onConfirm={confirmResetProgression}
        />
      ) : null}

      <header className="progressionWorkspaceHeader">
        <div>
          <p className="eyebrow">Full Editor</p>
          <h1>Progression Edit</h1>
          <p>コード譜を見ながら、小節と拍の流れを組み立てます。</p>
        </div>
        <div className="progressionWorkspaceActions">
          <ProgressionHistoryActions
            canRedo={canRedo}
            canUndo={canUndo}
            onRedo={redo}
            onReset={openResetDialog}
            onUndo={undo}
          />
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

      <ProgressionEditorMobileBar
        canRedo={canRedo}
        canUndo={canUndo}
        onRedo={redo}
        onReset={openResetDialog}
        onUndo={undo}
      />
    </main>
  );
}
