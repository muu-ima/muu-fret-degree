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

const naturalPitchClasses: Record<string, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
};

const keySignatureScale = 0.72;

const keySignatureAccidentalCounts: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  "F#": 6,
  "C#": 7,
  F: 1,
  Bb: 2,
  Eb: 3,
  Ab: 4,
  Am: 0,
  Em: 1,
  Bm: 2,
  "F#m": 3,
  "C#m": 4,
  "G#m": 5,
  "D#m": 6,
  "A#m": 7,
  Dm: 1,
  Gm: 2,
  Cm: 3,
  Fm: 4,
  Bbm: 5,
  Ebm: 6,
  Abm: 7,
};

function makeNotationLayout(containerWidth: number) {
  const width = Math.max(260, Math.floor(containerWidth));
  const isCompact = width <= 520;
  const staveX = isCompact ? 6 : 10;
  const rightInset = isCompact ? 6 : 10;
  const staveWidth = width - staveX - rightInset;
  const signatureReserve = width <= 360 ? 92 : width <= 560 ? 104 : 112;

  return {
    width,
    height: isCompact ? 104 : 118,
    staveX,
    staveY: isCompact ? 16 : 20,
    staveWidth,
    formatWidth: Math.max(150, staveWidth - signatureReserve),
  };
}

function keySignatureNoteShift(keySignature: string | undefined, width: number) {
  const accidentalCount = keySignature ? (keySignatureAccidentalCounts[keySignature] ?? 0) : 0;
  if (accidentalCount < 4) {
    return 0;
  }

  const baseShift = width <= 520 ? 3 : 2;
  const accidentalShift = width <= 520 ? 1.8 : 1.2;

  return Math.min(width <= 520 ? 15 : 11, baseShift + (accidentalCount - 3) * accidentalShift);
}

function scaleKeySignature(container: HTMLDivElement) {
  const signatureGroups = container.querySelectorAll<SVGGElement>(".vf-keysignature");

  signatureGroups.forEach((group) => {
    const box = group.getBBox();
    const originX = box.x;
    const originY = box.y + box.height / 2;
    group.setAttribute(
      "transform",
      `translate(${originX} ${originY}) scale(${keySignatureScale}) translate(${-originX} ${-originY})`,
    );
  });
}

function shiftStaveNotes(container: HTMLDivElement, shift: number) {
  if (shift <= 0) {
    return;
  }

  container.querySelectorAll<SVGGElement>(".vf-stavenote").forEach((group) => {
    group.setAttribute("transform", `translate(${-shift} 0)`);
  });
}

function noteParts(note: ScaleNote) {
  const match = /^([A-G])([#b]*?)$/.exec(note.note);
  const letter = match?.[1]?.toLowerCase() ?? "c";
  const accidental = match?.[2] ?? "";
  const accidentalOffset = accidental.split("").reduce((total, mark) => {
    if (mark === "#") {
      return total + 1;
    }

    if (mark === "b") {
      return total - 1;
    }

    return total;
  }, 0);
  const spelledPitchClass = naturalPitchClasses[letter] + accidentalOffset;
  const octave = Math.floor((note.midi - spelledPitchClass) / 12) - 1;

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

      const layout = makeNotationLayout(container.getBoundingClientRect().width);
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(layout.width, layout.height);

      const context = renderer.getContext();
      context.setFont("Arial", 10);

      const keySignature = keySignatureByScale[scaleName]?.(root);
      const noteShift = keySignatureNoteShift(keySignature, layout.width);
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
      scaleKeySignature(container);
      shiftStaveNotes(container, noteShift);

      setLabelPositions(staveNotes.map((note) => ((note.getAbsoluteX() - noteShift) / layout.width) * 100));
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
