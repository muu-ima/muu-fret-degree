"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import theory from "../../data/theory.json";
import { BassFretboard, MobileBassFretboard } from "./BassFretboard";
import { ChordDegreeStrip } from "./ChordDegreeStrip";
import { ControlsPanel } from "./ControlsPanel";
import { FretRangeTabs } from "./FretRangeTabs";
import { ProgressionEditor } from "./ProgressionEditor";
import { ProgressionPanel } from "./ProgressionPanel";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useBpmControl } from "../hooks/useBpmControl";
import { useChordPlayback } from "../hooks/useChordPlayback";
import { useProgressionPlayback } from "../hooks/useProgressionPlayback";
import { usePersistedProgression } from "../hooks/usePersistedProgression";
import { usePersistedPracticeSettings } from "../hooks/usePersistedPracticeSettings";
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
} from "../lib/music";
import {
  makeProgressionBar,
  resizeProgressionBars,
  type ChordProgression,
} from "../lib/progression";

type PracticeWorkspaceProps = {
  showProgressionEditor: boolean;
  pageMode: "practice" | "progression";
};

export function PracticeWorkspace({ showProgressionEditor, pageMode }: PracticeWorkspaceProps) {
  const [root, setRoot] = useState("C");
  const [chordTypeId, setChordTypeId] = useState("m7");
  const [tuningId, setTuningId] = useState("standard");
  const [showGuideTones, setShowGuideTones] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isProgressionPanelOpen, setIsProgressionPanelOpen] = useState(false);
  const [isProgressionEditorOpen, setIsProgressionEditorOpen] = useState(showProgressionEditor);
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

  useEffect(() => {
    const handleOpenControls = () => {
      setIsProgressionPanelOpen(false);
      setIsProgressionEditorOpen(false);
      setIsControlsOpen(true);
    };

    const handleOpenProgression = () => {
      setIsControlsOpen(false);
      setIsProgressionEditorOpen(false);
      setIsProgressionPanelOpen(true);
    };

    const handleOpenEdit = () => {
      if (!showProgressionEditor) {
        return;
      }

      setIsControlsOpen(false);
      setIsProgressionPanelOpen(false);
      setIsProgressionEditorOpen(true);
    };

    window.addEventListener("shell:open-controls", handleOpenControls);
    window.addEventListener("shell:open-progression", handleOpenProgression);
    window.addEventListener("shell:open-edit", handleOpenEdit);
    return () => {
      window.removeEventListener("shell:open-controls", handleOpenControls);
      window.removeEventListener("shell:open-progression", handleOpenProgression);
      window.removeEventListener("shell:open-edit", handleOpenEdit);
    };
  }, [showProgressionEditor]);

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
    progressionPlayback.isProgressionRunning &&
    currentProgressionBar !== undefined &&
    currentProgressionCell !== undefined;
  const displayedRoot = isProgressionSyncActive ? currentProgressionCell.root : root;
  const displayedChordType = isProgressionSyncActive ? currentProgressionChordType : chordType;
  const selectedFretRange =
    fretRanges.find((range) => range.id === selectedFretRangeId) ?? fretRanges[0];
  const selectedChordOctave = chordOctaves.find((octave) => octave.id === chordOctaveId) ?? chordOctaves[1];
  const chordInversions = useMemo(
    () => Array.from({ length: displayedChordType.intervals.length }, (_, index) => index),
    [displayedChordType],
  );
  const pageHeader =
    pageMode === "practice"
      ? {
          eyebrow: "Practice Mode",
          title: "Practice",
          summary: "指板で音を確認しながら、コード・音域・ガイドトーンを切り替える画面です。",
        }
      : {
          eyebrow: "Progression Edit",
          title: "Progression Edit",
          summary: "2拍単位のセルを編集して、2 / 4 / 8 / 16 小節のループを組む画面です。4 小節を基準に見せます。",
        };

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
        showTempoControls={pageMode === "practice"}
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

  function renderProgressionPanel() {
    return (
      <ProgressionPanel
        currentProgressionBar={progressionPlayback.currentProgressionBar}
        currentProgressionCell={currentProgressionSelection?.cell}
        currentProgressionCellIndex={currentProgressionSelection?.cellIndex}
        currentProgressionChordTypeName={currentProgressionChordType.name}
        progressionPosition={progressionPlayback.progressionPosition}
        isProgressionRunning={progressionPlayback.isProgressionRunning}
        showTempoControls={pageMode === "progression"}
        bpmInput={bpmInput}
        isMetronomeRunning={isMetronomeRunning}
        currentBeat={currentBeat}
        onStartProgression={progressionPlayback.startProgression}
        onStopProgression={progressionPlayback.stopProgression}
        onResetProgression={progressionPlayback.resetProgression}
        onBpmInputChange={updateBpm}
        onBpmCommit={commitBpm}
        onToggleMetronome={toggleMetronome}
      />
    );
  }

  function renderProgressionEditor(className?: string) {
    if (!showProgressionEditor) {
      return null;
    }

    return (
      <ProgressionEditor
        className={className}
        bars={progression.bars}
        barCount={progression.bars.length}
        barCountOptions={[2, 4, 8, 16]}
        roots={theory.roots}
        chordTypes={chordTypes}
        onBarCountChange={handleProgressionBarCountChange}
        onCellChange={handleProgressionBarCellChange}
      />
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">{pageHeader.eyebrow}</p>
          <p className="heroTitle">{pageHeader.title}</p>
          <p className="heroSummary">{pageHeader.summary}</p>
        </div>
        {pageMode === "practice" ? (
          <div className="chordBadge">
            <strong>{displayedRoot}</strong>
            <span>{displayedChordType.name}</span>
          </div>
        ) : null}
      </section>

      <div
        className={
          isControlsOpen || isProgressionPanelOpen || isProgressionEditorOpen
            ? "drawerBackdrop open"
            : "drawerBackdrop"
        }
        onClick={() => {
          setIsControlsOpen(false);
          setIsProgressionPanelOpen(false);
          setIsProgressionEditorOpen(false);
        }}
      />
      <aside
        className={isControlsOpen ? "shellControlsPanel open" : "shellControlsPanel"}
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
        {renderControls("controls shellControls")}
      </aside>
      <aside
        className={isProgressionPanelOpen ? "shellProgressionPanel open" : "shellProgressionPanel"}
        role="dialog"
        aria-modal="true"
        aria-label="コード進行再生"
      >
        <div className="drawerHeader">
          <strong>Progression</strong>
          <button type="button" className="closeButton" onClick={() => setIsProgressionPanelOpen(false)}>
            ×
          </button>
        </div>
        <div className="shellProgression">{renderProgressionPanel()}</div>
      </aside>
      {showProgressionEditor ? (
        <aside
          className={isProgressionEditorOpen ? "shellEditPanel open" : "shellEditPanel"}
          role="dialog"
          aria-modal="true"
          aria-label="コード進行編集"
        >
          <div className="drawerHeader">
            <strong>Progression Edit</strong>
            <button type="button" className="closeButton" onClick={() => setIsProgressionEditorOpen(false)}>
              ×
            </button>
          </div>
          <div className="shellEdit">{renderProgressionEditor("progressionEditor progressionEditorSheet")}</div>
        </aside>
      ) : null}

      <section className="fretboardCanvas">
        <div className="fretboardCanvasHeader">
          <div>
            {pageMode === "progression" ? (
              <div className="chordBadge chordBadgeProgression fretboardCanvasBadge">
                <strong>{displayedRoot}</strong>
                <span>{displayedChordType.name}</span>
              </div>
            ) : null}
            <p className="fretboardCanvasEyebrow">Canvas</p>
            <strong>Bass Fretboard</strong>
          </div>
          <div className="fretboardCanvasControls">
            <span>{selectedFretRange.label}</span>
            <FretRangeTabs
              fretRanges={fretRanges}
              selectedFretRangeId={selectedFretRange.id}
              onSelectFretRange={setSelectedFretRangeId}
            />
          </div>
        </div>

        <div className="fretboardCanvasStage">
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
        </div>

        <div className="fretboardCanvasFooter">
          <ChordDegreeStrip chordNotes={chordNotes} showGuideTones={showGuideTones} />
        </div>
      </section>
    </main>
  );
}
