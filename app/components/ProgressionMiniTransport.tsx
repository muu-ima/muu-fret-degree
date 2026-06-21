"use client";

import { useMemo } from "react";
import { LuPlay, LuSquare } from "react-icons/lu";
import theory from "../../data/theory.json";
import { useChordPlayback } from "../hooks/useChordPlayback";
import { useProgressionBeatScheduler } from "../hooks/useProgressionBeatScheduler";
import {
  type ChordType,
  type Tuning,
  makeChordMap,
  makeChordNotes,
  makeFretNotes,
} from "../lib/music";
import {
  useProgressionSession,
  useProgressionTransport,
  useSessionAudioOutput,
} from "../providers/ProgressionSessionProvider";

export function ProgressionMiniTransport() {
  const { progression } = useProgressionSession();
  const transport = useProgressionTransport();
  const { playBassNote, playPianoNote, resumeAudio } = useSessionAudioOutput();
  const chordTypes = theory.chordTypes as ChordType[];
  const tunings = theory.tunings as Tuning[];
  const fallbackCell = progression.bars[0]?.cells[0];
  const currentCell = transport.currentProgressionSelection?.cell ?? fallbackCell;
  const currentRoot = currentCell?.root ?? theory.roots[0];
  const currentChordType =
    chordTypes.find((chordType) => chordType.id === currentCell?.chordTypeId) ?? chordTypes[0];
  const standardTuning = tunings.find((tuning) => tuning.id === "standard") ?? tunings[0];
  const chordMap = useMemo(
    () => makeChordMap(currentRoot, currentChordType, theory.chromatic),
    [currentChordType, currentRoot],
  );
  const notes = useMemo(
    () => makeFretNotes(standardTuning, chordMap, theory.chromatic),
    [chordMap, standardTuning],
  );
  const chordNotes = useMemo(
    () => makeChordNotes(currentRoot, currentChordType),
    [currentChordType, currentRoot],
  );
  const { playProgressionBeat } = useChordPlayback({
    root: currentRoot,
    chordType: currentChordType,
    chordNotes,
    chordOctaveMidi: 60,
    chordInversion: 0,
    arpeggioPattern: "root-only",
    bpm: progression.bpm,
    notes,
    playBassNote,
    playPianoNote,
    resumeAudio,
  });

  useProgressionBeatScheduler({
    isRunning: transport.isProgressionRunning,
    playBeat: playProgressionBeat,
    position: transport.progressionPosition,
    progression,
    rhythm: "root-only",
  });

  const barNumber = progression.bars.length > 0
    ? (transport.progressionPosition.barIndex % progression.bars.length) + 1
    : 0;
  const positionLabel = progression.bars.length > 0
    ? `Bar ${barNumber} · Beat ${transport.progressionPosition.beatInBar + 1}`
    : "No bars";

  return (
    <div className="progressionMiniTransport" aria-label="簡易再生">
      <span className={transport.isProgressionRunning ? "playing" : ""}>
        {transport.isProgressionRunning ? "Playing" : "Stopped"} · {positionLabel}
      </span>
      <div role="group" aria-label="再生操作">
        <button
          type="button"
          className="play"
          aria-label="コード進行を再生"
          title="Play"
          disabled={transport.isProgressionRunning || progression.bars.length === 0}
          onClick={() => {
            resumeAudio();
            transport.startProgression();
          }}
        >
          <LuPlay aria-hidden="true" />
          <span>Play</span>
        </button>
        <button
          type="button"
          aria-label="コード進行を停止"
          title="Stop"
          disabled={!transport.isProgressionRunning}
          onClick={transport.stopProgression}
        >
          <LuSquare aria-hidden="true" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
}
