"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  makeProgressionBar,
  resizeProgressionBars,
  type ChordProgression,
} from "./lib/progression";

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
      makeProgressionBar(1, { root: "C", chordTypeId: "maj7" }),
      makeProgressionBar(2, { root: "A", chordTypeId: "m7" }),
      makeProgressionBar(3, { root: "D", chordTypeId: "m7" }),
      makeProgressionBar(4, { root: "G", chordTypeId: "7" }),
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
  const lastProgressionBeatRef = useRef<number | null>(null);
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
  const currentProgressionSelection = progressionPlayback.currentProgressionSelection;
  const currentProgressionBar = currentProgressionSelection?.bar;
  const currentProgressionCell = currentProgressionSelection?.cell;
  const currentProgressionChordType =
    chordTypes.find((chord) => chord.id === currentProgressionCell?.chordTypeId) ?? chordType;
  const isProgressionSyncActive =
    progressionPlayback.isProgressionRunning && currentProgressionBar !== undefined && currentProgressionCell !== undefined;
  const displayedRoot = isProgressionSyncActive ? currentProgressionCell.root : root;
  const displayedChordType = isProgressionSyncActive ? currentProgressionChordType : chordType;
  const selectedFretRange =
    fretRanges.find((range) => range.id === selectedFretRangeId) ?? fretRanges[0];
  const selectedChordOctave = chordOctaves.find((octave) => octave.id === chordOctaveId) ?? chordOctaves[1];
  const chordInversions = useMemo(
    () => Array.from({ length: displayedChordType.intervals.length }, (_, index) => index),
    [displayedChordType],
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
    () => makeChordMap(displayedRoot, displayedChordType, chromatic),
    [displayedRoot, displayedChordType, chromatic],
  );

  const notes = useMemo<FretNote[]>(() => {
    return makeFretNotes(tuning, chordMap, chromatic);
  }, [tuning, chromatic, chordMap]);

  const chordNotes = useMemo(
    () => makeChordNotes(displayedRoot, displayedChordType),
    [displayedChordType, displayedRoot],
  );
  const handleProgressionBarCellChange = (
    barIndex: number,
    cellIndex: number,
    nextCell: ChordProgression["bars"][number]["cells"][number],
  ) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: currentProgression.bars.map((bar, index) => {
        if (index !== barIndex) {
          return bar;
        }

        const nextCells = [
          cellIndex === 0 ? nextCell : bar.cells[0],
          cellIndex === 1 ? nextCell : bar.cells[1],
        ] as const;

        return {
          ...bar,
          cells: nextCells,
        };
      }),
    }));
  };
  const handleProgressionBarCountChange = (nextBarCount: number) => {
    setProgression((currentProgression) => ({
      ...currentProgression,
      bars: resizeProgressionBars(currentProgression.bars, nextBarCount),
    }));
  };
  const { playArpeggio, playNote, playProgressionBeat, playStack } = useChordPlayback({
    root: displayedRoot,
    chordType: displayedChordType,
    chordNotes,
    chordOctaveMidi: selectedChordOctave.midi,
    chordInversion,
    notes,
    playBassNote,
    playPianoNote,
    resumeAudio,
  });
  useEffect(() => {
    if (!isProgressionSyncActive) {
      lastProgressionBeatRef.current = null;
      return;
    }

    if (lastProgressionBeatRef.current === progressionPlayback.progressionPosition.beatIndex) {
      return;
    }

    lastProgressionBeatRef.current = progressionPlayback.progressionPosition.beatIndex;
    playProgressionBeat(progressionPlayback.progressionPosition.beatInBar % 2);
  }, [
    isProgressionSyncActive,
    playProgressionBeat,
    progressionPlayback.progressionPosition.beatInBar,
    progressionPlayback.progressionPosition.beatIndex,
  ]);

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
          <strong>{displayedRoot}</strong>
          <span>{displayedChordType.name}</span>
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
        currentProgressionCell={currentProgressionSelection?.cell}
        currentProgressionCellIndex={currentProgressionSelection?.cellIndex}
        currentProgressionChordTypeName={currentProgressionChordType.name}
        progressionPosition={progressionPlayback.progressionPosition}
        isProgressionRunning={progressionPlayback.isProgressionRunning}
        onStartProgression={progressionPlayback.startProgression}
        onStopProgression={progressionPlayback.stopProgression}
        onResetProgression={progressionPlayback.resetProgression}
      />

      <ProgressionEditor
        bars={progression.bars}
        barCount={progression.bars.length}
        barCountOptions={[4, 8, 16]}
        roots={theory.roots}
        chordTypes={chordTypes}
        onBarCountChange={handleProgressionBarCountChange}
        onCellChange={handleProgressionBarCellChange}
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
