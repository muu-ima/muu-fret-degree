"use client";

import { useEffect, useRef } from "react";
import { Barline, Beam, Formatter, Renderer, Stave, StaveNote, Tuplet, Voice } from "vexflow";

const notationHeight = 524;
const staveTopPositions = [26, 148, 270, 392];
const tripletNotesPerMeasure = 12;

const eMajorTwoOctaveNotes = [
  "e/2",
  "f#/2",
  "g#/2",
  "a/2",
  "b/2",
  "c#/3",
  "d#/3",
  "e/3",
  "f#/3",
  "g#/3",
  "a/3",
  "b/3",
  "c#/4",
  "d#/4",
  "e/4",
];

function makeTripletNotes(keys: string[]) {
  return keys.map(
    (key) =>
      new StaveNote({
        clef: "bass",
        duration: "8",
        keys: [key],
      }),
  );
}

function makeStave(y: number, width: number, options?: { end?: boolean; timeSignature?: boolean }) {
  const stave = new Stave(10, y, width);
  stave.addClef("bass", "small");
  stave.addKeySignature("E");

  if (options?.timeSignature) {
    stave.addTimeSignature("4/4");
  }

  if (options?.end) {
    stave.setEndBarType(Barline.type.END);
  }

  return stave;
}

function makeTripletGroups(notes: StaveNote[]) {
  return Array.from({ length: notes.length / 3 }, (_, index) => notes.slice(index * 3, index * 3 + 3));
}

function makeLoopingWaveNotes(noteCount: number) {
  const notes: string[] = [];
  let noteIndex = 0;
  let direction = 1;

  while (notes.length < noteCount) {
    notes.push(eMajorTwoOctaveNotes[noteIndex]);

    if (noteIndex === eMajorTwoOctaveNotes.length - 1) {
      direction = -1;
    } else if (noteIndex === 0) {
      direction = 1;
    }

    noteIndex += direction;
  }

  return notes;
}

export function EMajorTripletStudy() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const drawNotation = () => {
      container.replaceChildren();

      const width = Math.max(620, Math.floor(container.getBoundingClientRect().width));
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(width, notationHeight);

      const context = renderer.getContext();
      context.setFont("Arial", 10);

      const staveWidth = width - 24;
      const staves = staveTopPositions.map((y, index) =>
        makeStave(y, staveWidth, { end: index === staveTopPositions.length - 1, timeSignature: index === 0 }),
      );

      staves.forEach((stave) => stave.setContext(context).draw());
      const loopNotes = makeLoopingWaveNotes(staves.length * tripletNotesPerMeasure);

      const drawTripletMeasure = (stave: Stave, tripletKeys: string[]) => {
        const tripletNotes = makeTripletNotes(tripletKeys);
        const triplets = makeTripletGroups(tripletNotes).map(
          (notes) => new Tuplet(notes, { numNotes: 3, notesOccupied: 2, bracketed: false }),
        );
        const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(tripletNotes);
        const beams = makeTripletGroups(tripletNotes).map((notes) => new Beam(notes));

        new Formatter().joinVoices([voice]).formatToStave([voice], stave);
        voice.draw(context, stave);

        [...beams, ...triplets].forEach((notationElement) => {
          notationElement.setContext(context).draw();
        });
      };

      staves.forEach((stave, index) => {
        const start = index * tripletNotesPerMeasure;
        drawTripletMeasure(stave, loopNotes.slice(start, start + tripletNotesPerMeasure));
      });
    };

    drawNotation();

    const resizeObserver = new ResizeObserver(drawNotation);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <figure className="trainingNotationCard">
      <figcaption>
        <strong>E Major</strong>
        <span>2-octave wave / triplets / 4-4</span>
      </figcaption>
      <div className="trainingNotation" ref={containerRef} aria-label="E major two octave ascending and descending triplet notation" />
    </figure>
  );
}
