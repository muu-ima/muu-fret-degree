"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LuMaximize2, LuMinus } from "react-icons/lu";
import theory from "../../data/theory.json";
import { BassFretboard, MobileBassFretboard } from "./BassFretboard";
import { ChordDegreeStrip } from "./ChordDegreeStrip";
import { ControlsPanel } from "./ControlsPanel";
import { FretRangeTabs } from "./FretRangeTabs";
import { MetronomePanel } from "./MetronomePanel";
import { ProgressionEditor } from "./ProgressionEditor";
import { ProgressionPanel } from "./ProgressionPanel";
import { useAudioEngine } from "../hooks/useAudioEngine";
import { useBpmControl } from "../hooks/useBpmControl";
import { type ProgressionRhythm, useChordPlayback } from "../hooks/useChordPlayback";
import { useProgressionPlayback } from "../hooks/useProgressionPlayback";
import { usePersistedProgression } from "../hooks/usePersistedProgression";
import { usePersistedPracticeSettings } from "../hooks/usePersistedPracticeSettings";
import { type MetronomeTone } from "../lib/audio";
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

type DesktopPanelKey = "controls" | "metronome" | "progression" | "edit";
type DesktopPanelPosition = { x: number; y: number };

const bottomSheetHeightBounds = {
  min: 44,
  default: 78,
  max: 92,
};

export function PracticeWorkspace({ showProgressionEditor, pageMode }: PracticeWorkspaceProps) {
  const [root, setRoot] = useState("C");
  const [chordTypeId, setChordTypeId] = useState("m7");
  const [tuningId, setTuningId] = useState("standard");
  const [showGuideTones, setShowGuideTones] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
  const [isProgressionPanelOpen, setIsProgressionPanelOpen] = useState(false);
  const [isProgressionEditorOpen, setIsProgressionEditorOpen] = useState(showProgressionEditor);
  const [selectedFretRangeId, setSelectedFretRangeId] = useState<FretRange["id"]>("low");
  const [chordOctaveId, setChordOctaveId] = useState("C4");
  const [chordInversion, setChordInversion] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [pulsesPerBeat, setPulsesPerBeat] = useState(1);
  const [countInMeasures, setCountInMeasures] = useState(0);
  const [swingRatio, setSwingRatio] = useState(0);
  const [metronomeTone, setMetronomeTone] = useState<MetronomeTone>("soft");
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const [metronomeVolume, setMetronomeVolume] = useState(0.7);
  const [bottomSheetHeight, setBottomSheetHeight] = useState(bottomSheetHeightBounds.default);
  const [desktopPanelPositions, setDesktopPanelPositions] = useState<
    Partial<Record<DesktopPanelKey, DesktopPanelPosition>>
  >({});
  const [compactDesktopPanels, setCompactDesktopPanels] = useState<Partial<Record<DesktopPanelKey, boolean>>>({});
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
  const [progressionRhythm, setProgressionRhythm] = useState<ProgressionRhythm>("chord-tones");
  const { bpm, bpmInput, commitBpm, updateBpm } = useBpmControl();
  const {
    currentBeat,
    currentPulse,
    countInBeatsRemaining,
    isCountingIn,
    isMetronomeRunning,
    playBassNote,
    playPianoNote,
    resumeAudio,
    toggleMetronome,
  } = useAudioEngine({
    bpm,
    beatsPerMeasure,
    pulsesPerBeat,
    countInMeasures,
    swingRatio,
    metronomeTone,
    accentFirstBeat,
    metronomeVolume,
  });
  const progressionPlayback = useProgressionPlayback({ progression });
  const lastProgressionBeatRef = useRef<number | null>(null);
  const bottomSheetDragRef = useRef<{ startHeight: number; startY: number } | null>(null);
  const desktopPanelDragRef = useRef<{
    key: DesktopPanelKey;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    setProgression((currentProgression) =>
      currentProgression.bpm === bpm ? currentProgression : { ...currentProgression, bpm },
    );
  }, [bpm]);

  useEffect(() => {
    const handleOpenControls = () => {
      setIsMetronomeOpen(false);
      setIsProgressionPanelOpen(false);
      setIsProgressionEditorOpen(false);
      setIsControlsOpen(true);
    };

    const handleOpenProgression = () => {
      setIsControlsOpen(false);
      setIsMetronomeOpen(false);
      setIsProgressionEditorOpen(false);
      setIsProgressionPanelOpen(true);
    };

    const handleOpenEdit = () => {
      if (!showProgressionEditor) {
        return;
      }

      setIsControlsOpen(false);
      setIsMetronomeOpen(false);
      setIsProgressionPanelOpen(false);
      setIsProgressionEditorOpen(true);
    };

    const handleOpenMetronome = () => {
      setIsControlsOpen(false);
      setIsProgressionPanelOpen(false);
      setIsProgressionEditorOpen(false);
      setIsMetronomeOpen(true);
    };

    window.addEventListener("shell:open-controls", handleOpenControls);
    window.addEventListener("shell:open-metronome", handleOpenMetronome);
    window.addEventListener("shell:open-progression", handleOpenProgression);
    window.addEventListener("shell:open-edit", handleOpenEdit);
    return () => {
      window.removeEventListener("shell:open-controls", handleOpenControls);
      window.removeEventListener("shell:open-metronome", handleOpenMetronome);
      window.removeEventListener("shell:open-progression", handleOpenProgression);
      window.removeEventListener("shell:open-edit", handleOpenEdit);
    };
  }, [showProgressionEditor]);

  const closePanels = () => {
    setIsControlsOpen(false);
    setIsMetronomeOpen(false);
    setIsProgressionPanelOpen(false);
    setIsProgressionEditorOpen(false);
    window.dispatchEvent(new CustomEvent("shell:panel-close"));
  };

  const beginDesktopPanelDrag = (key: DesktopPanelKey, event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button")) {
      return;
    }

    const panel = event.currentTarget.closest("aside");
    if (!panel) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    desktopPanelDragRef.current = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      originX: bounds.left,
      originY: bounds.top,
      width: bounds.width,
    };
    setDesktopPanelPositions((positions) => ({
      ...positions,
      [key]: { x: bounds.left, y: bounds.top },
    }));
  };

  const moveDesktopPanel = (event: PointerEvent<HTMLDivElement>) => {
    const drag = desktopPanelDragRef.current;
    if (!drag) {
      return;
    }

    const nextX = drag.originX + event.clientX - drag.startX;
    const nextY = drag.originY + event.clientY - drag.startY;
    const maxX = Math.max(8, window.innerWidth - drag.width - 8);
    const maxY = Math.max(8, window.innerHeight - 64);

    setDesktopPanelPositions((positions) => ({
      ...positions,
      [drag.key]: {
        x: Math.min(maxX, Math.max(8, nextX)),
        y: Math.min(maxY, Math.max(8, nextY)),
      },
    }));
  };

  const finishDesktopPanelDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    desktopPanelDragRef.current = null;
  };

  const resetDesktopPanelPosition = (key: DesktopPanelKey) => {
    setDesktopPanelPositions((positions) => {
      const nextPositions = { ...positions };
      delete nextPositions[key];
      return nextPositions;
    });
  };

  const toggleDesktopPanelCompact = (key: DesktopPanelKey) => {
    setCompactDesktopPanels((panels) => ({ ...panels, [key]: !panels[key] }));
  };

  const updatePulsesPerBeat = (pulses: number) => {
    setPulsesPerBeat(pulses);
    if (pulses !== 2) {
      setSwingRatio(0);
    }
  };

  const clampBottomSheetHeight = (height: number) =>
    Math.min(bottomSheetHeightBounds.max, Math.max(bottomSheetHeightBounds.min, height));

  const beginBottomSheetResize = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    bottomSheetDragRef.current = {
      startHeight: bottomSheetHeight,
      startY: event.clientY,
    };
  };

  const resizeBottomSheet = (event: PointerEvent<HTMLButtonElement>) => {
    if (!bottomSheetDragRef.current) {
      return;
    }

    const viewportHeight = window.innerHeight || 1;
    const dragDistance = bottomSheetDragRef.current.startY - event.clientY;
    const nextHeight = bottomSheetDragRef.current.startHeight + (dragDistance / viewportHeight) * 100;
    setBottomSheetHeight(clampBottomSheetHeight(nextHeight));
  };

  const finishBottomSheetResize = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    bottomSheetDragRef.current = null;
  };

  const adjustBottomSheetWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setBottomSheetHeight((height) => clampBottomSheetHeight(height + 5));
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setBottomSheetHeight((height) => clampBottomSheetHeight(height - 5));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setBottomSheetHeight(bottomSheetHeightBounds.min);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setBottomSheetHeight(bottomSheetHeightBounds.max);
    }
  };

  const bottomSheetStyle = {
    "--bottom-sheet-height": `${bottomSheetHeight}dvh`,
  } as CSSProperties;

  const getDesktopPanelStyle = (key: DesktopPanelKey) => {
    const position = desktopPanelPositions[key];
    return {
      ...bottomSheetStyle,
      ...(position
        ? {
            "--desktop-panel-x": `${position.x}px`,
            "--desktop-panel-y": `${position.y}px`,
          }
        : {}),
    } as CSSProperties;
  };

  const getDesktopPanelClassName = (baseClassName: string, key: DesktopPanelKey, isOpen: boolean) =>
    [
      baseClassName,
      isOpen ? "open" : "",
      desktopPanelPositions[key] ? "dragged" : "",
      compactDesktopPanels[key] ? "compact" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const renderDrawerHeader = (
    key: DesktopPanelKey,
    title: ReactNode,
    compactSummary: ReactNode,
    titleClassName?: string,
  ) => {
    const isCompact = Boolean(compactDesktopPanels[key]);
    const CompactIcon = isCompact ? LuMaximize2 : LuMinus;

    return (
      <div
        className="drawerHeader"
        title="ドラッグしてパネルを移動"
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) {
            resetDesktopPanelPosition(key);
          }
        }}
        onPointerCancel={finishDesktopPanelDrag}
        onPointerDown={(event) => beginDesktopPanelDrag(key, event)}
        onPointerMove={moveDesktopPanel}
        onPointerUp={finishDesktopPanelDrag}
      >
        <span className="panelHeaderText">
          <strong className={titleClassName}>{title}</strong>
          <span className="compactPanelSummary">{compactSummary}</span>
        </span>
        <button
          type="button"
          className="compactButton"
          aria-label={isCompact ? "パネルを展開" : "パネルをコンパクト表示"}
          title={isCompact ? "パネルを展開" : "パネルをコンパクト表示"}
          onClick={() => toggleDesktopPanelCompact(key)}
        >
          <CompactIcon aria-hidden="true" />
        </button>
        <button type="button" className="closeButton" aria-label="パネルを閉じる" onClick={closePanels}>
          ×
        </button>
      </div>
    );
  };

  const renderBottomSheetHandle = () => (
    <button
      type="button"
      className="bottomSheetHandle"
      aria-label="ボトムシートの高さを調整"
      aria-valuemax={bottomSheetHeightBounds.max}
      aria-valuemin={bottomSheetHeightBounds.min}
      aria-valuenow={Math.round(bottomSheetHeight)}
      onDoubleClick={() => setBottomSheetHeight(bottomSheetHeightBounds.default)}
      onKeyDown={adjustBottomSheetWithKeyboard}
      onPointerCancel={finishBottomSheetResize}
      onPointerDown={beginBottomSheetResize}
      onPointerMove={resizeBottomSheet}
      onPointerUp={finishBottomSheetResize}
    >
      <span />
    </button>
  );

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
    const currentBarIndex = progressionPlayback.progressionPosition.barIndex % progression.bars.length;
    const currentBar = progression.bars[currentBarIndex];
    const currentCellIndex = currentProgressionSelection?.cellIndex ?? 0;
    const nextRoot =
      currentCellIndex === 0
        ? currentBar.cells[1].root
        : progression.bars[(currentBarIndex + 1) % progression.bars.length].cells[0].root;

    playProgressionBeat({
      beatInBar: progressionPlayback.progressionPosition.beatInBar,
      rhythm: progressionRhythm,
      nextRoot,
    });
  }, [
    currentProgressionSelection?.cellIndex,
    isProgressionSyncActive,
    playProgressionBeat,
    progression.bars,
    progressionPlayback.progressionPosition.beatInBar,
    progressionPlayback.progressionPosition.beatIndex,
    progressionPlayback.progressionPosition.barIndex,
    progressionRhythm,
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
        onRootChange={setRoot}
        onChordTypeChange={setChordTypeId}
        onTuningChange={setTuningId}
        onChordOctaveChange={setChordOctaveId}
        onChordInversionChange={setChordInversion}
        onShowGuideTonesChange={setShowGuideTones}
        onPlayArpeggio={playArpeggio}
        onPlayStack={playStack}
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
        rhythm={progressionRhythm}
        onStartProgression={progressionPlayback.startProgression}
        onStopProgression={progressionPlayback.stopProgression}
        onResetProgression={progressionPlayback.resetProgression}
        onRhythmChange={setProgressionRhythm}
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
          isControlsOpen || isMetronomeOpen || isProgressionPanelOpen || isProgressionEditorOpen
            ? "drawerBackdrop open"
            : "drawerBackdrop"
        }
        onClick={closePanels}
      />
      <aside
        className={getDesktopPanelClassName("shellControlsPanel", "controls", isControlsOpen)}
        role="dialog"
        aria-modal="true"
        aria-label="コードとチューニング"
        style={getDesktopPanelStyle("controls")}
      >
        {renderBottomSheetHandle()}
        {renderDrawerHeader("controls", `${root} ${chordType.name}`, tuning.name, "chordTitleValue")}
        {renderControls("controls shellControls")}
      </aside>
      <aside
        className={getDesktopPanelClassName(
          "shellControlsPanel shellMetronomePanel",
          "metronome",
          isMetronomeOpen,
        )}
        role="dialog"
        aria-modal="true"
        aria-label="メトロノーム"
        style={getDesktopPanelStyle("metronome")}
      >
        {renderBottomSheetHandle()}
        {renderDrawerHeader("metronome", "Metronome", `${bpm} BPM · ${beatsPerMeasure}/4`)}
        <div className="shellMetronome">
          <MetronomePanel
            isPanelOpen={isMetronomeOpen}
            bpm={bpm}
            bpmInput={bpmInput}
            currentBeat={currentBeat}
            currentPulse={currentPulse}
            countInBeatsRemaining={countInBeatsRemaining}
            beatsPerMeasure={beatsPerMeasure}
            pulsesPerBeat={pulsesPerBeat}
            countInMeasures={countInMeasures}
            swingRatio={swingRatio}
            tone={metronomeTone}
            accentFirstBeat={accentFirstBeat}
            volume={metronomeVolume}
            isRunning={isMetronomeRunning}
            isCountingIn={isCountingIn}
            onBpmInputChange={updateBpm}
            onBpmCommit={commitBpm}
            onBeatsPerMeasureChange={setBeatsPerMeasure}
            onPulsesPerBeatChange={updatePulsesPerBeat}
            onCountInMeasuresChange={setCountInMeasures}
            onSwingRatioChange={setSwingRatio}
            onToneChange={setMetronomeTone}
            onAccentFirstBeatChange={setAccentFirstBeat}
            onVolumeChange={setMetronomeVolume}
            onToggle={toggleMetronome}
          />
        </div>
      </aside>
      <aside
        className={getDesktopPanelClassName("shellProgressionPanel", "progression", isProgressionPanelOpen)}
        role="dialog"
        aria-modal="true"
        aria-label="コード進行再生"
        style={getDesktopPanelStyle("progression")}
      >
        {renderBottomSheetHandle()}
        {renderDrawerHeader(
          "progression",
          "Progression",
          `Bar ${progressionPlayback.currentProgressionBar?.bar ?? progressionPlayback.progressionPosition.barIndex + 1} · ${
            progressionRhythm === "four-beat" ? "4 Beat" : "Chord Tones"
          }`,
        )}
        <div className="shellProgression">{renderProgressionPanel()}</div>
      </aside>
      {showProgressionEditor ? (
        <aside
          className={getDesktopPanelClassName("shellEditPanel", "edit", isProgressionEditorOpen)}
          role="dialog"
          aria-modal="true"
          aria-label="コード進行編集"
          style={getDesktopPanelStyle("edit")}
        >
          {renderBottomSheetHandle()}
          {renderDrawerHeader("edit", "Progression Edit", `${progression.bars.length} bars`)}
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
