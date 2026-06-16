"use client";

import { useMemo, useState } from "react";
import theory from "../data/theory.json";
import { BassFretboard, MobileBassFretboard } from "./components/BassFretboard";
import { ControlsPanel } from "./components/ControlsPanel";
import { useAudioEngine } from "./hooks/useAudioEngine";
import {
  degreeTone,
  type ChordType,
  type FretNote,
  type FretRange,
  type Tuning,
  fretRanges,
  makeChordNotes,
  makeChordMap,
  makeFretNotes,
  trebleChordMidi,
} from "./lib/music";

export default function Home() {
  const [root, setRoot] = useState("C");
  const [chordTypeId, setChordTypeId] = useState("m7");
  const [tuningId, setTuningId] = useState("standard");
  const [showGuideTones, setShowGuideTones] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [selectedFretRangeId, setSelectedFretRangeId] = useState<FretRange["id"]>("low");
  const [bpm, setBpm] = useState(120);
  const [bpmInput, setBpmInput] = useState("120");
  const {
    currentBeat,
    isMetronomeRunning,
    playBassNote,
    playPianoNote,
    resumeAudio,
    toggleMetronome,
  } = useAudioEngine({ bpm });

  const chromatic = theory.chromatic;
  const chordTypes = theory.chordTypes as ChordType[];
  const tunings = theory.tunings as Tuning[];
  const chordType = chordTypes.find((chord) => chord.id === chordTypeId) ?? chordTypes[0];
  const tuning = tunings.find((item) => item.id === tuningId) ?? tunings[0];
  const selectedFretRange =
    fretRanges.find((range) => range.id === selectedFretRangeId) ?? fretRanges[0];

  const chordMap = useMemo(
    () => makeChordMap(root, chordType, chromatic),
    [root, chordType, chromatic],
  );

  const notes = useMemo<FretNote[]>(() => {
    return makeFretNotes(tuning, chordMap, chromatic);
  }, [tuning, chromatic, chordMap]);

  const chordNotes = useMemo(
    () => makeChordNotes(root, chordType),
    [chordType, root],
  );

  function playNote(note: FretNote) {
    resumeAudio();
    playBassNote(note.midi);
  }

  function playArpeggio() {
    resumeAudio();
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
    resumeAudio();
    chordType.intervals.forEach((interval, index) => {
      playPianoNote(trebleChordMidi(root, interval), index * 0.012, 1.9);
    });
  }

  function commitBpm(value: string) {
    const nextBpm = Number(value);
    const normalizedBpm = Number.isFinite(nextBpm)
      ? Math.min(240, Math.max(40, Math.round(nextBpm)))
      : bpm;
    setBpm(normalizedBpm);
    setBpmInput(String(normalizedBpm));
  }

  function updateBpm(value: string) {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setBpmInput(value);
    const nextBpm = Number(value);
    if (Number.isFinite(nextBpm) && nextBpm >= 40 && nextBpm <= 240) {
      setBpm(Math.round(nextBpm));
    }
  }


  function renderControls(className: string) {
    return (
      <ControlsPanel
        className={className}
        roots={theory.roots}
        chordTypes={chordTypes}
        tunings={tunings}
        root={root}
        chordTypeId={chordTypeId}
        tuningId={tuningId}
        showGuideTones={showGuideTones}
        bpmInput={bpmInput}
        isMetronomeRunning={isMetronomeRunning}
        currentBeat={currentBeat}
        onRootChange={setRoot}
        onChordTypeChange={setChordTypeId}
        onTuningChange={setTuningId}
        onShowGuideTonesChange={setShowGuideTones}
        onPlayArpeggio={playArpeggio}
        onPlayStack={playStack}
        onBpmInputChange={updateBpm}
        onBpmCommit={commitBpm}
        onToggleMetronome={toggleMetronome}
      />
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Electric Bass Chord Degrees</p>
          <h1>Bass Fret Degree</h1>
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

      <div className="fretRangeTabs" role="tablist" aria-label="表示するフレット範囲">
        {fretRanges.map((range) => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedFretRange.id === range.id}
            className={selectedFretRange.id === range.id ? "fretRangeTab active" : "fretRangeTab"}
            key={range.id}
            onClick={() => setSelectedFretRangeId(range.id)}
          >
            {range.label}
          </button>
        ))}
      </div>

      <BassFretboard
        notes={notes}
        tuning={tuning}
        fretRange={selectedFretRange}
        onPlayNote={playNote}
      />
      <MobileBassFretboard
        notes={notes}
        tuning={tuning}
        fretRange={selectedFretRange}
        onPlayNote={playNote}
      />

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
