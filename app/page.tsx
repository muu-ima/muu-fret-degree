"use client";

import { useMemo, useRef, useState } from "react";
import theory from "../data/theory.json";

type Interval = {
  degree: string;
  semitones: number;
};

type ChordType = {
  id: string;
  name: string;
  intervals: Interval[];
};

type BassString = {
  name: string;
  note: string;
  midi: number;
};

type Tuning = {
  id: string;
  name: string;
  strings: BassString[];
};

type FretNote = {
  id: string;
  stringIndex: number;
  fret: number;
  midi: number;
  pitchClass: string;
  note: string;
  degree?: string;
  inChord: boolean;
};

const fretCount = 12;
const nutWidth = 14;
const leftPad = 74;
const topPad = 54;
const boardWidth = 940;
const boardHeight = 290;
const stringGap = boardHeight / 3;
const fretGap = boardWidth / fretCount;
const markerFrets = new Set([3, 5, 7, 9]);

const degreeTone: Record<string, string> = {
  "1": "#e84d5b",
  "b3": "#2b7de9",
  "3": "#2b7de9",
  "4": "#16a085",
  "5": "#f2a51a",
  "b5": "#8f5bd5",
  "6": "#0f9d7a",
  "7": "#b4478f",
  "b7": "#b4478f",
  "bb7": "#6e5a46",
};

const sharpPitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flatPitchClasses = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const letterOrder = ["C", "D", "E", "F", "G", "A", "B"];

const degreeLetterSteps: Record<string, number> = {
  "1": 0,
  "b2": 1,
  "2": 1,
  "#2": 1,
  "bb3": 2,
  "b3": 2,
  "3": 2,
  "4": 3,
  "#4": 3,
  "b5": 4,
  "5": 4,
  "#5": 4,
  "b6": 5,
  "6": 5,
  "bb7": 6,
  "b7": 6,
  "7": 6,
};

function noteAt(chromatic: string[], midi: number) {
  return chromatic[((midi % 12) + 12) % 12];
}

function pitchClassAt(midi: number) {
  return sharpPitchClasses[((midi % 12) + 12) % 12];
}

function pitchClassOf(note: string) {
  const sharpIndex = sharpPitchClasses.indexOf(note);
  if (sharpIndex >= 0) {
    return sharpPitchClasses[sharpIndex];
  }

  const flatIndex = flatPitchClasses.indexOf(note);
  if (flatIndex >= 0) {
    return sharpPitchClasses[flatIndex];
  }

  return note;
}

function naturalPitchClass(letter: string) {
  return sharpPitchClasses.indexOf(letter);
}

function normalizeAccidental(offset: number) {
  if (offset > 6) {
    return offset - 12;
  }
  if (offset < -6) {
    return offset + 12;
  }
  return offset;
}

function spellIntervalNote(root: string, interval: Interval) {
  const rootLetter = root[0];
  const rootLetterIndex = letterOrder.indexOf(rootLetter);
  const degreeStep = degreeLetterSteps[interval.degree] ?? 0;
  const targetLetter = letterOrder[(rootLetterIndex + degreeStep) % letterOrder.length];
  const rootPitchClass = sharpPitchClasses.indexOf(pitchClassOf(root));
  const targetPitchClass = (rootPitchClass + interval.semitones) % sharpPitchClasses.length;
  const accidental = normalizeAccidental(targetPitchClass - naturalPitchClass(targetLetter));

  if (accidental === 0) {
    return targetLetter;
  }
  if (accidental > 0) {
    return targetLetter + "#".repeat(accidental);
  }
  return targetLetter + "b".repeat(Math.abs(accidental));
}

function frequencyFromMidi(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function makeChordMap(root: string, chordType: ChordType, chromatic: string[]) {
  const rootIndex = sharpPitchClasses.indexOf(pitchClassOf(root));
  return new Map(
    chordType.intervals.map((interval) => {
      const pitchClass = sharpPitchClasses[(rootIndex + interval.semitones) % chromatic.length];
      return [
        pitchClass,
        {
          degree: interval.degree,
          note: spellIntervalNote(root, interval),
        },
      ];
    }),
  );
}

function BassFretboard({
  notes,
  tuning,
  onPlayNote,
}: {
  notes: FretNote[];
  tuning: Tuning;
  onPlayNote: (note: FretNote) => void;
}) {
  const height = topPad * 2 + boardHeight;
  const width = leftPad + boardWidth + 32;

  return (
    <div className="fretboardShell desktopFretboard" aria-label="ベース指板">
      <svg
        className="fretboard"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="fretboard-title fretboard-desc"
      >
        <title id="fretboard-title">コード構成音の度数を表示するベース指板</title>
        <desc id="fretboard-desc">
          4弦ベースの0フレットから12フレットまでに、選択コードの構成音を度数で表示します。
        </desc>

        <rect
          className="fingerboard"
          x={leftPad}
          y={topPad - 18}
          width={boardWidth}
          height={boardHeight + 36}
          rx="6"
        />
        <rect
          className="nut"
          x={leftPad - nutWidth}
          y={topPad - 20}
          width={nutWidth}
          height={boardHeight + 40}
          rx="3"
        />

        {Array.from({ length: fretCount + 1 }, (_, fret) => {
          const x = leftPad + fret * fretGap;
          return (
            <g key={`fret-${fret}`}>
              <line
                className={fret === 0 ? "fret fretZero" : "fret"}
                x1={x}
                y1={topPad - 18}
                x2={x}
                y2={topPad + boardHeight + 18}
              />
              {fret > 0 ? (
                <text className="fretNumber" x={x - fretGap / 2} y={28}>
                  {fret}
                </text>
              ) : null}
            </g>
          );
        })}

        {[...markerFrets].map((fret) => (
          <circle
            key={`marker-${fret}`}
            className="positionMarker"
            cx={leftPad + (fret - 0.5) * fretGap}
            cy={topPad + boardHeight / 2}
            r="8"
          />
        ))}
        <g className="doubleMarker">
          <circle cx={leftPad + 11.5 * fretGap} cy={topPad + stringGap} r="7" />
          <circle cx={leftPad + 11.5 * fretGap} cy={topPad + stringGap * 2} r="7" />
        </g>

        {tuning.strings.map((string, stringIndex) => {
          const y = topPad + stringIndex * stringGap;
          return (
            <g key={`${string.name}-${stringIndex}`}>
              <text className="stringName" x={28} y={y + 6}>
                {string.name}
              </text>
              <line
                className={`bassString string-${stringIndex}`}
                x1={leftPad - nutWidth}
                y1={y}
                x2={leftPad + boardWidth}
                y2={y}
              />
            </g>
          );
        })}

        {notes.map((note) => {
          const x = note.fret === 0 ? leftPad - 34 : leftPad + (note.fret - 0.5) * fretGap;
          const y = topPad + note.stringIndex * stringGap;
          const color = note.degree ? degreeTone[note.degree] ?? "#333" : "#333";

          if (!note.inChord) {
            return null;
          }

          return (
            <g
              className="noteHit"
              key={note.id}
              tabIndex={0}
              role="button"
              aria-label={`${note.note} ${note.degree}度 ${note.fret}フレットを鳴らす`}
              onClick={() => onPlayNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPlayNote(note);
                }
              }}
            >
              <circle cx={x} cy={y} r="22" fill={color} />
              <text className="degreeLabel" x={x} y={y + 6}>
                {note.degree}
              </text>
              <text className="noteName" x={x} y={y + 37}>
                {note.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MobileBassFretboard({
  notes,
  tuning,
  onPlayNote,
}: {
  notes: FretNote[];
  tuning: Tuning;
  onPlayNote: (note: FretNote) => void;
}) {
  const mobileLeft = 56;
  const mobileTop = 86;
  const mobileWidth = 286;
  const mobileHeight = 740;
  const openStringLane = 44;
  const noteRadius = 18;
  const stringCount = tuning.strings.length;
  const mobileStringGap = mobileWidth / Math.max(stringCount - 1, 1);
  const mobileFretGap = mobileHeight / fretCount;
  const width = mobileLeft * 2 + mobileWidth;
  const height = mobileTop + mobileHeight + 56;

  return (
    <div className="fretboardShell mobileFretboard" aria-label="モバイル用ベース指板">
      <svg
        className="fretboard verticalFretboard"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="mobile-fretboard-title mobile-fretboard-desc"
      >
        <title id="mobile-fretboard-title">縦向きのコード構成音ベース指板</title>
        <desc id="mobile-fretboard-desc">
          スマートフォン向けに、フレットが上から下へ進む縦向き指板でコード構成音を表示します。
        </desc>

        <rect
          className="fingerboard"
          x={mobileLeft - noteRadius}
          y={mobileTop}
          width={mobileWidth + noteRadius * 2}
          height={mobileHeight}
          rx="6"
        />
        <rect
          className="nut"
          x={mobileLeft - noteRadius}
          y={mobileTop - nutWidth}
          width={mobileWidth + noteRadius * 2}
          height={nutWidth}
          rx="3"
        />

        {Array.from({ length: fretCount + 1 }, (_, fret) => {
          const y = mobileTop + fret * mobileFretGap;
          return (
            <g key={`mobile-fret-${fret}`}>
              <line
                className={fret === 0 ? "fret fretZero" : "fret"}
                x1={mobileLeft - noteRadius}
                y1={y}
                x2={mobileLeft + mobileWidth + noteRadius}
                y2={y}
              />
              {fret > 0 ? (
                <text className="fretNumber mobileFretNumber" x={24} y={y - mobileFretGap / 2 + 5}>
                  {fret}
                </text>
              ) : null}
            </g>
          );
        })}

        {[...markerFrets].map((fret) => (
          <circle
            key={`mobile-marker-${fret}`}
            className="positionMarker"
            cx={mobileLeft + mobileWidth / 2}
            cy={mobileTop + (fret - 0.5) * mobileFretGap}
            r="8"
          />
        ))}
        <g className="doubleMarker">
          <circle cx={mobileLeft + mobileStringGap} cy={mobileTop + 11.5 * mobileFretGap} r="7" />
          <circle cx={mobileLeft + mobileStringGap * 2} cy={mobileTop + 11.5 * mobileFretGap} r="7" />
        </g>

        {tuning.strings.map((string, stringIndex) => {
          const displayStringIndex = stringCount - 1 - stringIndex;
          const x = mobileLeft + displayStringIndex * mobileStringGap;
          return (
            <g key={`mobile-${string.name}-${stringIndex}`}>
              <text className="stringName mobileStringName" x={x} y={36}>
                {string.name}
              </text>
              <line
                className={`bassString string-${stringIndex}`}
                x1={x}
                y1={mobileTop - nutWidth}
                x2={x}
                y2={mobileTop + mobileHeight}
              />
            </g>
          );
        })}

        {notes.map((note) => {
          if (!note.inChord) {
            return null;
          }

          const displayStringIndex = stringCount - 1 - note.stringIndex;
          const x = mobileLeft + displayStringIndex * mobileStringGap;
          const y =
            note.fret === 0
              ? mobileTop - openStringLane / 2
              : mobileTop + (note.fret - 0.5) * mobileFretGap;
          const color = note.degree ? degreeTone[note.degree] ?? "#333" : "#333";

          return (
            <g
              className="noteHit"
              key={`mobile-${note.id}`}
              tabIndex={0}
              role="button"
              aria-label={`${note.note} ${note.degree}度 ${note.fret}フレットを鳴らす`}
              onClick={() => onPlayNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPlayNote(note);
                }
              }}
            >
              <circle cx={x} cy={y} r={noteRadius} fill={color} />
              <text className="degreeLabel" x={x} y={y + 6}>
                {note.degree}
              </text>
              <text className="noteName" x={x} y={y + noteRadius + 12}>
                {note.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Home() {
  const audioContext = useRef<AudioContext | null>(null);
  const [root, setRoot] = useState("C");
  const [chordTypeId, setChordTypeId] = useState("m7");
  const [tuningId, setTuningId] = useState("standard");
  const [showGuideTones, setShowGuideTones] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const chromatic = theory.chromatic;
  const chordTypes = theory.chordTypes as ChordType[];
  const tunings = theory.tunings as Tuning[];
  const chordType = chordTypes.find((chord) => chord.id === chordTypeId) ?? chordTypes[0];
  const tuning = tunings.find((item) => item.id === tuningId) ?? tunings[0];

  const chordMap = useMemo(
    () => makeChordMap(root, chordType, chromatic),
    [root, chordType, chromatic],
  );

  const notes = useMemo<FretNote[]>(() => {
    return tuning.strings.flatMap((string, stringIndex) =>
      Array.from({ length: fretCount + 1 }, (_, fret) => {
        const midi = string.midi + fret;
        const pitchClass = pitchClassAt(midi);
        const chordTone = chordMap.get(pitchClass);
        return {
          id: `${stringIndex}-${fret}`,
          stringIndex,
          fret,
          midi,
          pitchClass,
          note: chordTone?.note ?? noteAt(chromatic, midi),
          degree: chordTone?.degree,
          inChord: Boolean(chordTone),
        };
      }),
    );
  }, [tuning, chromatic, chordMap]);

  const chordNotes = useMemo(
    () =>
      chordType.intervals.map((interval) => ({
        ...interval,
        note: spellIntervalNote(root, interval),
      })),
    [chordType, root],
  );

  function ensureAudioContext() {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    return audioContext.current;
  }

  function playBassNote(midi: number, startOffset = 0, duration = 0.85) {
    const context = ensureAudioContext();
    const start = context.currentTime + startOffset;
    const end = start + duration;
    const frequency = frequencyFromMidi(midi);
    const oscillator = context.createOscillator();
    const subOscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const drive = context.createWaveShaper();

    const curve = new Float32Array(256);
    for (let i = 0; i < curve.length; i += 1) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 2.4);
    }

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, start);
    subOscillator.type = "sine";
    subOscillator.frequency.setValueAtTime(frequency / 2, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(880, start);
    filter.frequency.exponentialRampToValueAtTime(180, end);
    filter.Q.setValueAtTime(3.5, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.38, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(drive);
    subOscillator.connect(drive);
    drive.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start(start);
    subOscillator.start(start);
    oscillator.stop(end + 0.05);
    subOscillator.stop(end + 0.05);
  }

  function playNote(note: FretNote) {
    void ensureAudioContext().resume();
    playBassNote(note.midi);
  }

  function playArpeggio() {
    void ensureAudioContext().resume();
    const playable = chordNotes.map((chordNote) => {
      const candidates = notes.filter((note) => note.degree === chordNote.degree && note.fret <= 7);
      return candidates.sort((a, b) => a.midi - b.midi)[0];
    });

    playable.forEach((note, index) => {
      if (note) {
        playBassNote(note.midi, index * 0.32, 0.7);
      }
    });
  }

  function playStack() {
    void ensureAudioContext().resume();
    chordNotes.forEach((chordNote, index) => {
      const candidate = notes
        .filter((note) => note.degree === chordNote.degree)
        .sort((a, b) => Math.abs(a.midi - 40) - Math.abs(b.midi - 40))[0];
      if (candidate) {
        playBassNote(candidate.midi + (index > 1 ? 12 : 0), 0, 1.35);
      }
    });
  }


  function renderControls(className: string) {
    return (
      <section className={className} aria-label="コードとチューニング">
          <label>
            Root
            <select value={root} onChange={(event) => setRoot(event.target.value)}>
              {theory.roots.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Chord
            <select value={chordTypeId} onChange={(event) => setChordTypeId(event.target.value)}>
              {chordTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tuning
            <select value={tuningId} onChange={(event) => setTuningId(event.target.value)}>
              {tunings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showGuideTones}
              onChange={(event) => setShowGuideTones(event.target.checked)}
            />
            3rd / 7th を強調
          </label>
          <button type="button" onClick={playArpeggio}>
            Arpeggio
          </button>
          <button type="button" className="secondaryButton" onClick={playStack}>
            Chord
          </button>
        </section>
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Electric Bass Chord Degrees</p>
          <h1>ベース指板コード度数ビューア</h1>
        </div>
        <div className="chordBadge">
          <strong>{root}</strong>
          <span>{chordType.name}</span>
        </div>
      </section>

      <div className="mobileActionBar">
        <button
          type="button"
          className="menuButton"
          onClick={() => setIsControlsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isControlsOpen}
        >
          <span aria-hidden="true">☰</span>
          Controls
        </button>
      </div>

      {renderControls("controls desktopControls")}

      <div className={isControlsOpen ? "drawerBackdrop open" : "drawerBackdrop"} onClick={() => setIsControlsOpen(false)} />
      <aside
        className={isControlsOpen ? "controlsDrawer open" : "controlsDrawer"}
        role="dialog"
        aria-modal="true"
        aria-label="コードとチューニング"
      >
        <div className="drawerHeader">
          <strong>{root} {chordType.name}</strong>
          <button type="button" className="closeButton" onClick={() => setIsControlsOpen(false)}>
            ×
          </button>
        </div>
        {renderControls("controls drawerControls")}
      </aside>

      <BassFretboard notes={notes} tuning={tuning} onPlayNote={playNote} />
      <MobileBassFretboard notes={notes} tuning={tuning} onPlayNote={playNote} />

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
    </main>
  );
}
