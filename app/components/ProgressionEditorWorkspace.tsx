"use client";

import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import theory from "../../data/theory.json";
import { useProgressionState } from "../hooks/useProgressionState";
import type { ChordType } from "../lib/music";
import { ProgressionEditor } from "./ProgressionEditor";

export function ProgressionEditorWorkspace() {
  const chordTypes = theory.chordTypes as ChordType[];
  const { progression, updateBarCount, updateCell } = useProgressionState({
    roots: theory.roots,
    chordTypes,
  });

  return (
    <main className="progressionWorkspace">
      <header className="progressionWorkspaceHeader">
        <div>
          <p className="eyebrow">Full Editor</p>
          <h1>Progression Edit</h1>
          <p>コード譜を見ながら、小節と拍の流れを組み立てます。</p>
        </div>
        <Link className="progressionWorkspaceBack" href="/">
          <LuArrowLeft aria-hidden="true" />
          Practice
        </Link>
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
    </main>
  );
}
