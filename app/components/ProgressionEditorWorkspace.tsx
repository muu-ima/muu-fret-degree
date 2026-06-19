"use client";

import Link from "next/link";
import { useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import theory from "../../data/theory.json";
import { usePersistedProgression } from "../hooks/usePersistedProgression";
import type { ChordType } from "../lib/music";
import {
  createDefaultProgression,
  resizeProgressionBars,
  type ChordProgression,
} from "../lib/progression";
import { ProgressionEditor } from "./ProgressionEditor";

export function ProgressionEditorWorkspace() {
  const chordTypes = theory.chordTypes as ChordType[];
  const [progression, setProgression] = useState<ChordProgression>(() => createDefaultProgression());

  usePersistedProgression({
    progression,
    setProgression,
    roots: theory.roots,
    chordTypes,
  });

  const handleBarCountChange = (nextBarCount: number) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: resizeProgressionBars(currentProgression.bars, nextBarCount),
    }));
  };

  const handleCellChange = (
    barIndex: number,
    cellIndex: number,
    nextCell: ChordProgression["bars"][number]["cells"][number],
  ) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: currentProgression.bars.map((bar, index) => {
        if (index !== barIndex) {
          return bar;
        }

        return {
          ...bar,
          cells: [
            cellIndex === 0 ? nextCell : bar.cells[0],
            cellIndex === 1 ? nextCell : bar.cells[1],
          ] as const,
        };
      }),
    }));
  };

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
        onBarCountChange={handleBarCountChange}
        onCellChange={handleCellChange}
      />
    </main>
  );
}
