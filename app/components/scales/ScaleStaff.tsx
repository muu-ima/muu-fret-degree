import type { ScaleNote } from "../../lib/scales";

type ScaleStaffProps = {
  root: string;
  scaleName: string;
  notes: ScaleNote[];
};

const letterSteps: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const staff = {
  width: 760,
  height: 154,
  left: 96,
  right: 716,
  top: 48,
  gap: 12,
};

function parseNoteName(note: string, midi: number) {
  const letter = note[0] ?? "C";
  const accidental = note.slice(1);
  const octave = Math.floor(midi / 12) - 1;

  return { letter, accidental, octave };
}

function diatonicStep(note: string, midi: number) {
  const { letter, octave } = parseNoteName(note, midi);
  return octave * 7 + letterSteps[letter];
}

function noteY(note: string, midi: number) {
  const bottomLineG2 = 2 * 7 + letterSteps.G;
  const position = diatonicStep(note, midi) - bottomLineG2;
  const bottomY = staff.top + staff.gap * 4;

  return {
    y: bottomY - position * (staff.gap / 2),
    position,
  };
}

function ledgerPositions(position: number) {
  if (position < 0) {
    return Array.from({ length: Math.floor(Math.abs(position) / 2) }, (_, index) => -2 - index * 2);
  }

  if (position > 8) {
    return Array.from({ length: Math.floor((position - 8) / 2) }, (_, index) => 10 + index * 2);
  }

  return [];
}

export function ScaleStaff({ root, scaleName, notes }: ScaleStaffProps) {
  const noteSpacing = 58;
  const noteStart = 206;

  return (
    <figure className="scaleStaffCard">
      <figcaption>
        <strong>{root}</strong>
        <span>{scaleName}</span>
      </figcaption>
      <svg className="scaleStaffSvg" viewBox={`0 0 ${staff.width} ${staff.height}`} role="img" aria-label={`${root} ${scaleName}`}>
        <g className="staffLines">
          {Array.from({ length: 5 }, (_, index) => (
            <line key={index} x1={staff.left} x2={staff.right} y1={staff.top + index * staff.gap} y2={staff.top + index * staff.gap} />
          ))}
        </g>

        <g className="bassClef" aria-hidden="true">
          <path d="M128 58c15 0 24 9 24 22 0 21-21 34-43 38 18-8 29-20 29-34 0-10-6-16-15-16-6 0-10 3-10 8 0 4 3 7 7 7 3 0 6-2 7-5 3 2 5 5 5 9 0 8-7 14-16 14-10 0-18-8-18-18 0-14 13-25 30-25Z" />
          <circle cx="151" cy="66" r="2.6" />
          <circle cx="151" cy="82" r="2.6" />
        </g>

        <text className="scaleTimeSignature" x="166" y="84" aria-hidden="true">
          4/4
        </text>

        {notes.map((note, index) => {
          const x = noteStart + index * noteSpacing;
          const { y, position } = noteY(note.note, note.midi);
          const accidental = parseNoteName(note.note, note.midi).accidental;

          return (
            <g key={`${note.degree}-${note.midi}-${index}`} className="scaleNote">
              {ledgerPositions(position).map((ledgerPosition) => {
                const ledgerY = staff.top + staff.gap * 4 - ledgerPosition * (staff.gap / 2);
                return <line key={ledgerPosition} className="ledgerLine" x1={x - 15} x2={x + 15} y1={ledgerY} y2={ledgerY} />;
              })}
              {accidental ? (
                <text className="noteAccidental" x={x - 23} y={y + 5}>
                  {accidental}
                </text>
              ) : null}
              <ellipse className="noteHead" cx={x} cy={y} rx="10.5" ry="7.2" transform={`rotate(-18 ${x} ${y})`} />
              <line className="noteStem" x1={x + 9} x2={x + 9} y1={y - 2} y2={y - 42} />
              <text className="noteLabel" x={x} y="133">
                {note.note}
              </text>
              <text className="degreeLabel" x={x} y="148">
                {note.degree}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
