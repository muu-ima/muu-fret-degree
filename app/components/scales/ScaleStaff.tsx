"use client";

import { useEffect, useId, useRef } from "react";
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { ScaleNote } from "../../lib/scales";

type ScaleStaffProps = {
  root: string;
  scaleName: string;
  notes: ScaleNote[];
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

function makeStaveNote(note: ScaleNote) {
  const { accidental, key } = noteParts(note);
  const staveNote = new StaveNote({
    clef: "bass",
    duration: "8",
    keys: [key],
    stemDirection: 1,
  });

  if (accidental) {
    staveNote.addModifier(new Accidental(accidental), 0);
  }

  return staveNote;
}

export function ScaleStaff({ root, scaleName, notes }: ScaleStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.replaceChildren();

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(760, 154);

    const context = renderer.getContext();
    context.setFont("Arial", 10);

    const stave = new Stave(18, 30, 720);
    stave.addClef("bass").addTimeSignature("4/4");
    stave.setContext(context).draw();

    const staveNotes = notes.map(makeStaveNote);
    const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);

    new Formatter().joinVoices([voice]).format([voice], 585);
    voice.draw(context, stave);
  }, [notes]);

  return (
    <figure className="scaleStaffCard" aria-labelledby={titleId}>
      <figcaption id={titleId}>
        <strong>{root}</strong>
        <span>{scaleName}</span>
      </figcaption>
      <div className="scaleStaffVexflow" ref={containerRef} aria-hidden="true" />
      <ol className="scaleNoteList" aria-label={`${root} ${scaleName} notes`}>
        {notes.map((note, index) => (
          <li key={`${note.degree}-${note.midi}-${index}`}>
            <span>{note.note}</span>
            <small>{note.degree}</small>
          </li>
        ))}
      </ol>
    </figure>
  );
}
