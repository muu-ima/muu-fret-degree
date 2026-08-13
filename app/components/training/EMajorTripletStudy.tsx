"use client";

import { useEffect, useRef } from "react";
import { Barline, Beam, Formatter, GhostNote, Renderer, Stave, StaveNote, Tuplet, Voice } from "vexflow";

const notationHeight = 456;
const staveTopPositions = [42, 178, 314];
const measuresPerRow = 2;
const tripletNotesPerMeasure = 12;
const metronomeMarkerOffset = {
  x: 6,
  y: 5,
};

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

type MeasureSpec = {
  continuation?: boolean;
  tripletKeys: string[];
};

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

function makeStave(x: number, y: number, width: number, options?: { end?: boolean; keySignature?: boolean; timeSignature?: boolean }) {
  const stave = new Stave(x, y, width);

  if (options?.keySignature) {
    stave.addClef("bass", "small");
    stave.addKeySignature("E");
  }

  if (options?.timeSignature) {
    stave.addTimeSignature("4/4");
  }

  if (options?.end) {
    stave.setEndBarType(Barline.type.REPEAT_END);
  }

  return stave;
}

function makeTripletGroups(notes: StaveNote[]) {
  return Array.from({ length: notes.length / 3 }, (_, index) => notes.slice(index * 3, index * 3 + 3));
}

function markTripletTailNotes(container: HTMLDivElement, stave: Stave, notes: StaveNote[]) {
  const svg = container.querySelector("svg");
  if (!svg) {
    return;
  }

  const markerY = stave.getYForBottomText(1) + metronomeMarkerOffset.y;

  notes.forEach((note, index) => {
    if ((index + 1) % 3 !== 0) {
      return;
    }

    const marker = document.createElementNS("http://www.w3.org/2000/svg", "text");
    marker.setAttribute("class", "trainingMetronomeMarker");
    marker.setAttribute("x", String(note.getAbsoluteX() + metronomeMarkerOffset.x));
    marker.setAttribute("y", String(markerY));
    marker.textContent = "メ";
    svg.appendChild(marker);
  });
}

function markContinuation(container: HTMLDivElement, stave: Stave, note: GhostNote) {
  const svg = container.querySelector("svg");
  if (!svg) {
    return;
  }

  const marker = document.createElementNS("http://www.w3.org/2000/svg", "text");
  marker.setAttribute("class", "trainingContinuationMarker");
  marker.setAttribute("x", String(note.getAbsoluteX() + 8));
  marker.setAttribute("y", String(stave.getYForLine(2)));
  marker.textContent = "〜";
  svg.appendChild(marker);
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

function makeMeasureSpecs() {
  const movementNotes = makeLoopingWaveNotes(tripletNotesPerMeasure * 6);
  const specs: MeasureSpec[] = Array.from({ length: 4 }, (_, index) => {
    const start = index * tripletNotesPerMeasure;
    return { tripletKeys: movementNotes.slice(start, start + tripletNotesPerMeasure) };
  });
  const restartMeasure = movementNotes.slice(tripletNotesPerMeasure * 4, tripletNotesPerMeasure * 5);
  const continuationMeasure = movementNotes.slice(tripletNotesPerMeasure * 5, tripletNotesPerMeasure * 5 + 9);

  return [
    ...specs,
    {
      tripletKeys: restartMeasure,
    },
    {
      continuation: true,
      tripletKeys: continuationMeasure,
    },
  ];
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

      const measureSpecs = makeMeasureSpecs();
      const rowWidth = width - 24;
      const firstMeasureWidth = Math.floor(rowWidth * 0.53);
      const secondMeasureWidth = rowWidth - firstMeasureWidth;
      const staves = staveTopPositions.flatMap((y, rowIndex) => {
        const firstMeasureIndex = rowIndex * measuresPerRow;
        const secondMeasureIndex = firstMeasureIndex + 1;
        return [
          makeStave(10, y, firstMeasureWidth, {
            keySignature: true,
            timeSignature: rowIndex === 0,
          }),
          makeStave(10 + firstMeasureWidth, y, secondMeasureWidth, {
            end: secondMeasureIndex === measureSpecs.length - 1,
          }),
        ];
      });

      staves.forEach((stave) => stave.setContext(context).draw());

      const drawTripletMeasure = (stave: Stave, measure: MeasureSpec) => {
        const tripletNotes = makeTripletNotes(measure.tripletKeys);
        const continuationNote = measure.continuation ? new GhostNote("4") : undefined;
        const triplets = makeTripletGroups(tripletNotes).map(
          (notes) => new Tuplet(notes, { numNotes: 3, notesOccupied: 2, bracketed: false }),
        );
        const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(
          continuationNote ? [...tripletNotes, continuationNote] : tripletNotes,
        );
        const beams = makeTripletGroups(tripletNotes).map((notes) => new Beam(notes));

        new Formatter().joinVoices([voice]).formatToStave([voice], stave);
        voice.draw(context, stave);

        [...beams, ...triplets].forEach((notationElement) => {
          notationElement.setContext(context).draw();
        });

        markTripletTailNotes(container, stave, tripletNotes);
        if (continuationNote) {
          markContinuation(container, stave, continuationNote);
        }
      };

      staves.forEach((stave, index) => {
        drawTripletMeasure(stave, measureSpecs[index]);
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
        <span>2-octave wave to low E, then restart / triplets / 4-4</span>
      </figcaption>
      <div className="trainingNotation" ref={containerRef} aria-label="E major two octave ascending and descending triplet notation" />
    </figure>
  );
}
