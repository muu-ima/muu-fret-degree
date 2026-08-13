"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { ScaleFingering, ScaleId, ScaleNote } from "../../lib/scales";

type ScaleStaffProps = {
  annotationMode?: ScaleAnnotationMode;
  fingering?: ScaleFingering;
  heading?: string;
  keySignature?: string;
  meta?: string;
  root: string;
  scaleId: ScaleId;
  scaleName: string;
  notes: ScaleNote[];
};

type ScaleAnnotationMode = "degree" | "fingering";

type ScaleNotationSystemProps = {
  annotationMode: ScaleAnnotationMode;
  ariaLabel?: string;
  className: string;
  fingering?: ScaleFingering;
  formatReserveOffset?: number;
  keySignature?: string;
  labelIndexOffset?: number;
  labelPositionOffset?: number;
  layoutWidth?: number;
  notes: ScaleNote[];
  root: string;
  scaleId: ScaleId;
  scaleName: string;
};

type ScaleStaffLayoutOverride = {
  compact?: {
    accidentalScale?: number;
    height?: number;
    labelOffsets?: Record<number, number>;
    noteOffsets?: Record<number, number>;
    noteScale?: number;
    noteShift?: number;
    signatureReserve?: number;
    staveY?: number;
  };
};

const keySignatureByScale: Record<string, (root: string) => string> = {
  Major: (root) => root,
  Aeolian: (root) => `${root}m`,
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
const compactNaturalNoteCenterOffset = 3;
const printNotationWidth = 700;

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

const scaleStaffLayoutOverrides: Partial<Record<ScaleId, Partial<Record<string, ScaleStaffLayoutOverride>>>> = {};

function keySignatureAccidentalCount(keySignature: string | undefined) {
  return keySignature ? (keySignatureAccidentalCounts[keySignature] ?? 0) : 0;
}

function writtenAccidentalCount(notes: ScaleNote[]) {
  return notes.reduce((total, note) => total + noteParts(note).accidental.length, 0);
}

function makeDensityProfile(accidentalCount: number, width: number) {
  const isCompact = width <= 520;
  const compactReserves = [76, 84, 90, 96, 102, 108, 114, 120];
  const defaultReserves = [52, 56, 60, 64, 68, 72, 76, 80];
  const shifts = isCompact ? [0, 0, 2, 4, 6, 8, 10, 12] : [0, 0, 0, 0, 2, 4, 6, 8];
  const scales = isCompact ? [0.98, 0.98, 0.96, 0.95, 0.94, 0.92, 0.9, 0.88] : [1, 1, 1, 1, 0.96, 0.94, 0.92, 0.9];
  const accidentalScales = isCompact ? [0.96, 0.96, 0.92, 0.9, 0.88, 0.86, 0.84, 0.82] : [1, 1, 1, 1, 0.96, 0.94, 0.92, 0.9];
  const index = Math.min(Math.max(accidentalCount, 0), 7);

  return {
    accidentalScale: accidentalScales[index],
    noteScale: scales[index],
    noteShift: shifts[index],
    signatureReserve: isCompact ? compactReserves[index] : defaultReserves[index],
  };
}

function makeNotationLayout(
  containerWidth: number,
  root: string,
  scaleId: ScaleId,
  notes: ScaleNote[],
  keySignature?: string,
  formatReserveOffset = 0,
) {
  const width = Math.max(260, Math.floor(containerWidth));
  const isCompact = width <= 520;
  const isTwoOctaves = notes.length > 8;
  const staveX = isTwoOctaves ? (isCompact ? 1 : 2) : isCompact ? 6 : 10;
  const rightInset = isTwoOctaves ? (isCompact ? 1 : 2) : isCompact ? 6 : 10;
  const staveWidth = width - staveX - rightInset;
  const accidentalCount = keySignature ? keySignatureAccidentalCount(keySignature) : writtenAccidentalCount(notes);
  const densityProfile = makeDensityProfile(accidentalCount, width);
  const compactOverride = isCompact ? scaleStaffLayoutOverrides[scaleId]?.[root]?.compact : undefined;
  const signatureReserve =
    compactOverride?.signatureReserve ?? Math.max(36, densityProfile.signatureReserve - (isTwoOctaves ? 20 : 0) - formatReserveOffset);

  return {
    ...densityProfile,
    ...compactOverride,
    width,
    height: compactOverride?.height ?? (isCompact ? 124 : 132),
    staveX,
    staveY: compactOverride?.staveY ?? (isCompact ? 21 : 32),
    staveWidth,
    formatWidth: Math.max(150, staveWidth - signatureReserve),
  };
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

function naturalNoteCenterOffset(note: ScaleNote, layout: ReturnType<typeof makeNotationLayout>, keySignature?: string) {
  const isCompact = layout.width <= 520;

  if (!isCompact || keySignature || noteParts(note).accidental) {
    return 0;
  }

  return compactNaturalNoteCenterOffset;
}

function noteXOffset(note: ScaleNote, index: number, layout: ReturnType<typeof makeNotationLayout>, keySignature?: string) {
  return -layout.noteShift + naturalNoteCenterOffset(note, layout, keySignature) + (layout.noteOffsets?.[index] ?? 0);
}

function transformStaveNotes(
  container: HTMLDivElement,
  notes: ScaleNote[],
  layout: ReturnType<typeof makeNotationLayout>,
  keySignature?: string,
) {
  if (layout.noteShift <= 0 && layout.noteScale === 1 && !layout.noteOffsets && layout.width > 520) {
    return;
  }

  container.querySelectorAll<SVGGElement>(".vf-stavenote").forEach((group, index) => {
    const box = group.getBBox();
    const originX = box.x + box.width / 2;
    const originY = box.y + box.height / 2;
    const xOffset = noteXOffset(notes[index], index, layout, keySignature);
    group.setAttribute(
      "transform",
      `translate(${xOffset} 0) translate(${originX} ${originY}) scale(${layout.noteScale}) translate(${-originX} ${-originY})`,
    );
  });
}

function transformAccidentals(container: HTMLDivElement, scale: number) {
  if (scale === 1) {
    return;
  }

  container.querySelectorAll<SVGGElement>(".vf-accidental").forEach((group) => {
    const box = group.getBBox();
    const originX = box.x + box.width / 2;
    const originY = box.y + box.height / 2;
    group.setAttribute("transform", `translate(${originX} ${originY}) scale(${scale}) translate(${-originX} ${-originY})`);
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
  return note.degree;
}

function scaleNoteListClassName(annotationMode: ScaleAnnotationMode, notes: ScaleNote[]) {
  const classNames = ["scaleNoteList"];

  if (annotationMode === "fingering") {
    classNames.push("fingering");
  }

  if (notes.length > 8) {
    classNames.push("twoOctaves");
  }

  return classNames.join(" ");
}

function renderScaleAnnotation(note: ScaleNote, index: number, annotationMode: ScaleAnnotationMode, fingering?: ScaleFingering) {
  if (annotationMode === "fingering") {
    const fingerNumber = fingering?.[index] ?? "";

    return (
      <small className="scaleFingerNumber" aria-label={`Finger number for ${note.note}`}>
        {fingerNumber}
      </small>
    );
  }

  return <small>{makeDegreeLabel(note)}</small>;
}

function ScaleNotationSystem({
  annotationMode,
  ariaLabel,
  className,
  fingering,
  formatReserveOffset = 0,
  keySignature,
  labelIndexOffset = 0,
  labelPositionOffset = 0,
  layoutWidth,
  notes,
  root,
  scaleId,
  scaleName,
}: ScaleNotationSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [labelPositions, setLabelPositions] = useState<number[]>([]);
  const vexflowClassName = keySignature ? "scaleStaffVexflow withKeySignature" : "scaleStaffVexflow withoutKeySignature";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const drawNotation = (width = layoutWidth ?? container.getBoundingClientRect().width) => {
      container.replaceChildren();

      const layout = makeNotationLayout(width, root, scaleId, notes, keySignature, formatReserveOffset);
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(layout.width, layout.height);

      const context = renderer.getContext();
      context.setFont("Arial", 10);

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
      transformStaveNotes(container, notes, layout, keySignature);
      transformAccidentals(container, layout.accidentalScale);

      setLabelPositions(
        staveNotes.map(
          (note, index) =>
            ((note.getAbsoluteX() + noteXOffset(notes[index], index, layout, keySignature)) / layout.width) * 100 +
            (layout.labelOffsets?.[index] ?? 0) +
            labelPositionOffset,
        ),
      );
    };

    drawNotation();

    if (layoutWidth) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => drawNotation());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [formatReserveOffset, keySignature, labelPositionOffset, layoutWidth, notes, root, scaleId]);

  return (
    <div className={`scaleStaffNotation ${className}`}>
      <div className={vexflowClassName} ref={containerRef} aria-hidden="true" />
      <ol className={scaleNoteListClassName(annotationMode, notes)} aria-label={ariaLabel ?? `${root} ${scaleName} notes`}>
        {notes.map((note, index) => {
          const annotationIndex = labelIndexOffset + index;

          return (
            <li
              key={`${note.degree}-${note.midi}-${annotationIndex}`}
              style={{ left: `${labelPositions[index] ?? ((index + 0.5) / notes.length) * 100}%` }}
            >
              <span>{note.note}</span>
              {renderScaleAnnotation(note, annotationIndex, annotationMode, fingering)}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function firstOctaveNotes(notes: ScaleNote[]) {
  return notes.length > 8 ? notes.slice(0, 8) : notes;
}

function twoOctaveModalSystems(notes: ScaleNote[]) {
  return notes.length > 8
    ? [
        { labelIndexOffset: 0, notes: notes.slice(0, 8) },
        { labelIndexOffset: 7, notes: notes.slice(7) },
      ]
    : [{ labelIndexOffset: 0, notes }];
}

export function ScaleStaff({
  annotationMode = "degree",
  fingering,
  heading,
  keySignature: keySignatureOverride,
  meta,
  root,
  scaleId,
  scaleName,
  notes,
}: ScaleStaffProps) {
  const titleId = useId();
  const modalId = useId();
  const modalTitleId = useId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const keySignature = keySignatureOverride ?? keySignatureByScale[scaleName]?.(root);
  const isTwoOctaves = notes.length > 8;
  const mobilePreviewNotes = firstOctaveNotes(notes);
  const modalSystems = twoOctaveModalSystems(notes);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <figure className="scaleStaffCard" aria-labelledby={titleId}>
      <figcaption id={titleId}>
        <strong>{heading ?? root}</strong>
        <span>
          {scaleName}
          {meta && <small>{meta}</small>}
        </span>
      </figcaption>
      {isTwoOctaves && (
        <button
          className="scaleStaffMobilePreviewButton scaleStaffScreenNotation"
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          aria-controls={isModalOpen ? modalId : undefined}
        >
          <ScaleNotationSystem
            annotationMode={annotationMode}
            className="scaleStaffMobilePreviewNotation"
            fingering={fingering}
            keySignature={keySignature}
            labelPositionOffset={3.4}
            notes={mobilePreviewNotes}
            root={root}
            scaleId={scaleId}
            scaleName={scaleName}
          />
        </button>
      )}
      <ScaleNotationSystem
        annotationMode={annotationMode}
        className="scaleStaffScreenNotation scaleStaffSingleScreenNotation"
        fingering={fingering}
        keySignature={keySignature}
        notes={notes}
        root={root}
        scaleId={scaleId}
        scaleName={scaleName}
      />
      <ScaleNotationSystem
        annotationMode={annotationMode}
        className="scaleStaffPrintNotation"
        fingering={fingering}
        keySignature={keySignature}
        layoutWidth={printNotationWidth}
        notes={notes}
        root={root}
        scaleId={scaleId}
        scaleName={scaleName}
      />
      {isModalOpen && (
        <div className="scaleStaffModalBackdrop" role="presentation" onClick={() => setIsModalOpen(false)}>
          <div
            id={modalId}
            className="scaleStaffModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="scaleStaffModalHeader">
              <div>
                <p>{scaleName}</p>
                <h2 id={modalTitleId}>{heading ?? root}</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close two octave notation">
                Close
              </button>
            </header>
            <div className="scaleStaffModalScroller">
              {modalSystems.map((system, systemIndex) => (
                <ScaleNotationSystem
                  key={`${system.notes[0]?.midi ?? systemIndex}-${systemIndex}`}
                  annotationMode={annotationMode}
                  ariaLabel={`${root} ${scaleName} octave ${systemIndex + 1} notes`}
                  className="scaleStaffModalNotation"
                  fingering={fingering}
                  formatReserveOffset={34}
                  keySignature={keySignature}
                  labelIndexOffset={system.labelIndexOffset}
                  notes={system.notes}
                  root={root}
                  scaleId={scaleId}
                  scaleName={scaleName}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
