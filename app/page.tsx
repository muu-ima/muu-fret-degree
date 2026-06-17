"use client";

import { useEffect, useMemo, useState } from "react";
import theory from "../data/theory.json";
import { BassFretboard, MobileBassFretboard } from "./components/BassFretboard";
import { ChordDegreeStrip } from "./components/ChordDegreeStrip";
import { ControlsPanel } from "./components/ControlsPanel";
import { FretRangeTabs } from "./components/FretRangeTabs";
import { ProgressionEditor } from "./components/ProgressionEditor";
import { ProgressionPanel } from "./components/ProgressionPanel";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useBpmControl } from "./hooks/useBpmControl";
import { useChordPlayback } from "./hooks/useChordPlayback";
import { useProgressionPlayback } from "./hooks/useProgressionPlayback";
import { usePersistedProgression } from "./hooks/usePersistedProgression";
import { usePersistedPracticeSettings } from "./hooks/usePersistedPracticeSettings";
import {
  type ChordType,
  type FretNote,
  type FretRange,
  type Tuning,
  chordOctaves,
  fretRanges,
  makeChordNotes,
  makeChordMap,
  makeFretNotes,
} from "./lib/music";
import { type ChordProgression } from "./lib/progression";

export default function Home() {
  const [root, setRoot] = useState("C");
  const [chordTypeId, setChordTypeId] = useState("m7");
  const [tuningId, setTuningId] = useState("standard");
  const [showGuideTones, setShowGuideTones] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [selectedFretRangeId, setSelectedFretRangeId] = useState<FretRange["id"]>("low");
  const [chordOctaveId, setChordOctaveId] = useState("C4");
  const [chordInversion, setChordInversion] = useState(0);
  const [progression, setProgression] = useState<ChordProgression>(() => ({
    bpm: 120,
    timeSignature: { beatsPerBar: 4, beatUnit: 4 },
    bars: [
      { bar: 1, root: "C", chordTypeId: "maj7" },
      { bar: 2, root: "A", chordTypeId: "m7" },
      { bar: 3, root: "D", chordTypeId: "m7" },
      { bar: 4, root: "G", chordTypeId: "7" },
    ],
  }));
  const { bpm, bpmInput, commitBpm, updateBpm } = useBpmControl();
  const {
    currentBeat,
    isMetronomeRunning,
    playBassNote,
    playPianoNote,
    resumeAudio,
    toggleMetronome,
  } = useAudioEngine({ bpm });
  const progressionPlayback = useProgressionPlayback({ progression });
  useEffect(() => {
    setProgression((currentProgression) =>
      currentProgression.bpm === bpm ? currentProgression : { ...currentProgression, bpm },
    );
  }, [bpm]);

  const chromatic = theory.chromatic;
  const chordTypes = theory.chordTypes as ChordType[];
  const tunings = theory.tunings as Tuning[];
  const chordType = chordTypes.find((chord) => chord.id === chordTypeId) ?? chordTypes[0];
  const tuning = tunings.find((item) => item.id === tuningId) ?? tunings[0];
  const selectedFretRange =
    fretRanges.find((range) => range.id === selectedFretRangeId) ?? fretRanges[0];
  const selectedChordOctave = chordOctaves.find((octave) => octave.id === chordOctaveId) ?? chordOctaves[1];
  const chordInversions = useMemo(
    () => Array.from({ length: chordType.intervals.length }, (_, index) => index),
    [chordType],
  );

  useEffect(() => {
    setChordInversion((currentInversion) => Math.min(currentInversion, chordInversions.length - 1));
  }, [chordInversions]);

  usePersistedPracticeSettings({
    values: {
      root,
      chordTypeId,
      tuningId,
      fretRangeId: selectedFretRangeId,
      chordOctaveId,
      chordInversion,
      showGuideTones,
      bpm,
    },
    setters: {
      setRoot,
      setChordTypeId,
      setTuningId,
      setFretRangeId: setSelectedFretRangeId,
      setChordOctaveId,
      setChordInversion,
      setShowGuideTones,
      commitBpm,
    },
    options: {
      roots: theory.roots,
      chordTypes,
      tunings,
      fretRanges,
      chordOctaves,
    },
  });
  usePersistedProgression({
    progression,
    setProgression,
    roots: theory.roots,
    chordTypes,
  });

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
  const handleProgressionBarChange = (barIndex: number, nextBar: ChordProgression["bars"][number]) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: currentProgression.bars.map((bar, index) =>
        index === barIndex ? { ...nextBar, bar: bar.bar } : bar,
      ),
    }));
  };
  const { playArpeggio, playNote, playStack } = useChordPlayback({
    root,
    chordType,
    chordNotes,
    chordOctaveMidi: selectedChordOctave.midi,
    chordInversion,
    notes,
    playBassNote,
    playPianoNote,
    resumeAudio,
  });

  function renderControls(className: string) {
    return (
      <ControlsPanel
        className={className}
        roots={theory.roots}
        chordTypes={chordTypes}
        tunings={tunings}
        chordOctaves={chordOctaves}
        chordInversions={chordInversions}
        root={root}
        chordTypeId={chordTypeId}
        tuningId={tuningId}
        chordOctaveId={selectedChordOctave.id}
        chordInversion={chordInversion}
        showGuideTones={showGuideTones}
        bpmInput={bpmInput}
        isMetronomeRunning={isMetronomeRunning}
        currentBeat={currentBeat}
        onRootChange={setRoot}
        onChordTypeChange={setChordTypeId}
        onTuningChange={setTuningId}
        onChordOctaveChange={setChordOctaveId}
        onChordInversionChange={setChordInversion}
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

      <ProgressionPanel
        currentProgressionBar={progressionPlayback.currentProgressionBar}
        progressionPosition={progressionPlayback.progressionPosition}
        isProgressionRunning={progressionPlayback.isProgressionRunning}
        onStartProgression={progressionPlayback.startProgression}
        onStopProgression={progressionPlayback.stopProgression}
        onResetProgression={progressionPlayback.resetProgression}
      />

      <ProgressionEditor
        bars={progression.bars}
        roots={theory.roots}
        chordTypes={chordTypes}
        onBarChange={handleProgressionBarChange}
      />

      <FretRangeTabs
        fretRanges={fretRanges}
        selectedFretRangeId={selectedFretRange.id}
        onSelectFretRange={setSelectedFretRangeId}
      />

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

      <ChordDegreeStrip chordNotes={chordNotes} showGuideTones={showGuideTones} />
    </main>
  );
}
