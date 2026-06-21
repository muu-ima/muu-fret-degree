"use client";

import { degreeTone, type ChordNote } from "../../lib/music";

type ChordDegreeStripProps = {
  chordNotes: ChordNote[];
  showGuideTones: boolean;
};

export function ChordDegreeStrip({ chordNotes, showGuideTones }: ChordDegreeStripProps) {
  return (
    <section className="degreeStrip" aria-label="コード構成音">
      {chordNotes.map((item) => {
        const isGuideTone = item.degree.includes("3") || item.degree.includes("7");
        return (
          <div
            className={showGuideTones && isGuideTone ? "degreeCard guideTone" : "degreeCard"}
            key={`${item.note}-${item.degree}`}
          >
            <span style={{ background: degreeTone[item.degree] ?? "#333" }}>{item.degree}</span>
            <strong>{item.note}</strong>
          </div>
        );
      })}
    </section>
  );
}
