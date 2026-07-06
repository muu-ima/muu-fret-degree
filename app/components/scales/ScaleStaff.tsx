"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { ScaleNote } from "../../lib/scales";

type ScaleStaffProps = {
  root: string;
  scaleName: string;
  notes: ScaleNote[];
};

const keySignatureByScale: Record<string, (root: string) => string> = {
  Major: (root) => root,
  "Natural Minor": (root) => `${root}m`,
};

const notationLayouts = {
  default: {
    width: 860,
    height: 140,
    staveX: 12,
    staveY: 30,
    staveWidth: 814,
    formatWidth: 560,
  },
  compact: {
    width: 620,
    height: 118,
    staveX: 8,
    staveY: 20,
    staveWidth: 560,
    formatWidth: 350,
  },
};

function noteParts(note: ScaleNote) {
  const match = /^([A-G])([#b]*?)$/.exec(note.note);
  const letter = match?.[1]?.toLowerCase() ?? "c";
  const accidental = match?.[2] ?? "";
  const octave = Math.floor(note.midi / 12) - 1;

  return {
    accidental,
    key: `${letter}${accidental.toLowerCase()}/${octave}`,
  };
}

function makeStaveNote(note: ScaleNote, showAccidental: boolean) {
  const { accidental, key } = noteParts(note);
  const staveNote = new StaveNote({
    clef: "bass",
    duration: "w",
    keys: [key],
  });

  if (showAccidental && accidental) {
    staveNote.addModifier(new Accidental(accidental), 0);
  }

  return staveNote;
}

function makeDegreeLabel(note: ScaleNote) {
  const degreeNumber = note.degree.replace(/^[#b]+/, "");
  const noteAccidental = noteParts(note).accidental;

  if (degreeNumber === "1" || degreeNumber === "8") {
    return degreeNumber;
  }

  return `${noteAccidental}${degreeNumber}`;
}

export function ScaleStaff({ root, scaleName, notes }: ScaleStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [labelPositions, setLabelPositions] = useState<number[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const drawNotation = () => {
      container.replaceChildren();

      const layout = container.clientWidth <= 520 ? notationLayouts.compact : notationLayouts.default;
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(layout.width, layout.height);

      const context = renderer.getContext();
      context.setFont("Arial", 10);

      const keySignature = keySignatureByScale[scaleName]?.(root);
      const stave = new Stave(layout.staveX, layout.staveY, layout.staveWidth);
      stave.addClef("bass", "small");
      if (keySignature) {
        stave.addKeySignature(keySignature);
      }
      stave.setContext(context).draw();

      const staveNotes = notes.map((note) => makeStaveNote(note, !keySignature));
      const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
      voice.addTickables(staveNotes);

      new Formatter().joinVoices([voice]).format([voice], layout.formatWidth);
      voice.draw(context, stave);

      setLabelPositions(staveNotes.map((note) => (note.getAbsoluteX() / layout.width) * 100));
    };

    drawNotation();

    const resizeObserver = new ResizeObserver(drawNotation);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [notes, root, scaleName]);

  return (
    <figure className="scaleStaffCard" aria-labelledby={titleId}>
      <figcaption id={titleId}>
        <strong>{root}</strong>
        <span>{scaleName}</span>
      </figcaption>
      <div className="scaleStaffNotation">
        <div className="scaleStaffVexflow" ref={containerRef} aria-hidden="true" />
        <ol className="scaleNoteList" aria-label={`${root} ${scaleName} notes`}>
          {notes.map((note, index) => (
            <li
              key={`${note.degree}-${note.midi}-${index}`}
              style={{ left: `${labelPositions[index] ?? ((index + 0.5) / notes.length) * 100}%` }}
            >
              <span>{note.note}</span>
              <small>{makeDegreeLabel(note)}</small>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
