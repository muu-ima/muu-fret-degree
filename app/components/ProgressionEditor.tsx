"use client";

import { useEffect, useState } from "react";
import { formatChordSymbol, formatChordTypeSymbol } from "../lib/chord-symbol";
import { type ChordType } from "../lib/music";
import {
  canSetProgressionRhythmDuration,
  canTieProgressionBeat,
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionBeatSubdivision,
  getProgressionCellForBeat,
  getProgressionRhythmEventAtStep,
  getProgressionSustainingEventAtStep,
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionCell,
  type ProgressionDurationSteps,
  type ProgressionSubdivision,
} from "../lib/progression";
import { ProgressionChordChart } from "./ProgressionChordChart";

type ProgressionEditorProps = {
  className?: string;
  bars: readonly ProgressionBar[];
  barCount: number;
  barCountOptions: number[];
  roots: string[];
  chordTypes: ChordType[];
  onBarCountChange: (barCount: number) => void;
  onBeatSubdivisionChange: (
    barIndex: number,
    beatIndex: number,
    subdivision: ProgressionSubdivision,
  ) => void;
  onBeatChordChange: (barIndex: number, beatIndex: number, cell: ProgressionCell | undefined) => void;
  onBeatDurationChange: (
    barIndex: number,
    beatIndex: number,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onBeatEventTypeChange: (
    barIndex: number,
    beatIndex: number,
    eventType: ProgressionBeatEventType,
  ) => void;
  onCellChange: (barIndex: number, cellIndex: number, cell: ProgressionCell) => void;
  onRhythmEventChange: (
    barIndex: number,
    startStep: number,
    eventType: ProgressionBeatEventType,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onRhythmEventRemove: (barIndex: number, startStep: number) => void;
};

export function ProgressionEditor({
  className = "progressionEditor",
  bars,
  barCount,
  barCountOptions,
  roots,
  chordTypes,
  onBarCountChange,
  onBeatSubdivisionChange,
  onBeatChordChange,
  onBeatDurationChange,
  onBeatEventTypeChange,
  onCellChange,
  onRhythmEventChange,
  onRhythmEventRemove,
}: ProgressionEditorProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepInBeat, setSelectedStepInBeat] = useState(0);

  useEffect(() => {
    setSelectedBarIndex((currentIndex) => Math.min(currentIndex, Math.max(bars.length - 1, 0)));
  }, [bars.length]);

  const selectBeat = (barIndex: number, beatIndex: number) => {
    setSelectedBarIndex(barIndex);
    setSelectedBeatIndex(beatIndex);
    setSelectedStepInBeat(0);
  };

  const selectedBar = bars[selectedBarIndex] ?? bars[0];
  const selectedSubdivision = selectedBar
    ? getProgressionBeatSubdivision(selectedBar, selectedBeatIndex)
    : undefined;
  const selectedCellIndex = Math.floor(selectedBeatIndex / 2);
  const baseCell = selectedBar?.cells[selectedCellIndex];
  const beatOverride = selectedBar?.beats?.[selectedBeatIndex]?.chordOverride;
  const selectedStartStep = selectedBeatIndex * progressionStepsPerBeat + selectedStepInBeat;
  const selectedRhythmEvent = selectedBar
    ? getProgressionRhythmEventAtStep(selectedBar, selectedStartStep)
    : undefined;
  const selectedBeatEventType =
    selectedStepInBeat === 0
      ? selectedBar
        ? getProgressionBeatEventType(selectedBar, selectedBeatIndex)
        : "hit"
      : selectedRhythmEvent?.eventType;
  const selectedBeatDuration =
    selectedStepInBeat === 0
      ? selectedBar
        ? getProgressionBeatDuration(selectedBar, selectedBeatIndex)
        : 4
      : selectedRhythmEvent?.durationSteps ?? 1;
  const canTieSelectedBeat = canTieProgressionBeat(
    bars,
    selectedBarIndex,
    selectedBeatIndex,
  );
  const editScope = beatOverride ? "beat" : "cell";
  const selectedCell = editScope === "beat" ? beatOverride ?? baseCell : baseCell;

  if (!selectedBar || !selectedCell) {
    return null;
  }

  const applyCellChange = (nextCell: ProgressionCell) => {
    if (editScope === "beat") {
      onBeatChordChange(selectedBarIndex, selectedBeatIndex, nextCell);
      return;
    }

    onCellChange(selectedBarIndex, selectedCellIndex, nextCell);
  };

  const useCellScope = () => {
    onBeatChordChange(selectedBarIndex, selectedBeatIndex, undefined);
  };

  const useBeatScope = () => {
    if (!beatOverride) {
      onBeatChordChange(
        selectedBarIndex,
        selectedBeatIndex,
        getProgressionCellForBeat(selectedBar, selectedBeatIndex),
      );
    }
  };

  const applySubdivision = (subdivision: ProgressionSubdivision) => {
    setSelectedStepInBeat(0);
    onBeatSubdivisionChange(selectedBarIndex, selectedBeatIndex, subdivision);
  };

  return (
    <section className={className} aria-label="コード進行編集">
      <div className="progressionEditorHeader">
        <div>
          <p className="progressionLabel">Progression Edit</p>
          <strong>{barCount}-bar loop</strong>
        </div>
        <div className="barCountTabs" role="tablist" aria-label="Bars">
          {barCountOptions.map((count) => {
            const isActive = count === barCount;
            return (
              <button
                key={count}
                type="button"
                className={isActive ? "barCountTab active" : "barCountTab"}
                aria-pressed={isActive}
                onClick={() => onBarCountChange(count)}
              >
                {count} bars
              </button>
            );
          })}
        </div>
      </div>
      <ProgressionChordChart
        bars={bars}
        chordTypes={chordTypes}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        selectedStepInBeat={selectedStepInBeat}
        onBeatSelect={selectBeat}
      />
      <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
        <div className="progressionSelectionHeader">
          <div>
            <span>Selected</span>
            <strong>
              Bar {selectedBar.bar} · Beat {selectedBeatIndex + 1}
              {selectedStepInBeat > 0 ? ` · ${["1", "e", "&", "a"][selectedStepInBeat]}` : ""}
            </strong>
          </div>
          <div className="progressionSelectionChord">
            <strong>{formatChordSymbol(selectedCell.root, selectedCell.chordTypeId, chordTypes)}</strong>
            <span>
              {editScope === "beat"
                ? `Beat ${selectedBeatIndex + 1} override`
                : `Editing Beats ${selectedCellIndex === 0 ? "1-2" : "3-4"}`}
            </span>
          </div>
        </div>

        <div className="progressionBeatTabs" role="tablist" aria-label="編集する拍">
          {[0, 1, 2, 3].map((beatIndex) => {
            const isSelected = selectedBeatIndex === beatIndex;
            return (
              <button
                key={beatIndex}
                type="button"
                className={isSelected ? "active" : ""}
                aria-selected={isSelected}
                role="tab"
                onClick={() => selectBeat(selectedBarIndex, beatIndex)}
              >
                Beat {beatIndex + 1}
              </button>
            );
          })}
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Rhythm Preset</span>
          <div className="progressionApplyTabs progressionSubdivisionTabs" role="group" aria-label="拍の分割プリセット">
            {(
              [
                { value: "eighths", label: "8ths ×2" },
                { value: "sixteenths", label: "16ths ×4" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={selectedSubdivision === option.value ? "active" : ""}
                aria-pressed={selectedSubdivision === option.value}
                onClick={() => applySubdivision(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="progressionStepSection">
          <span className="controlLabel">Start Position</span>
          <div className="progressionStepTabs" role="tablist" aria-label="編集する開始位置">
            {[
              { label: "1", stepInBeat: 0 },
              { label: "e", stepInBeat: 1 },
              { label: "&", stepInBeat: 2 },
              { label: "a", stepInBeat: 3 },
            ].map(({ label, stepInBeat }) => {
              const startStep = selectedBeatIndex * progressionStepsPerBeat + stepInBeat;
              const event = getProgressionRhythmEventAtStep(selectedBar, startStep);
              const sustainingEvent = event
                ? undefined
                : getProgressionSustainingEventAtStep(selectedBar, startStep);
              const isSelected = selectedStepInBeat === stepInBeat;
              return (
                <button
                  key={label}
                  type="button"
                  className={`${isSelected ? "active" : ""}${event ? ` ${event.eventType}` : sustainingEvent ? " held" : " empty"}`}
                  aria-selected={isSelected}
                  role="tab"
                  onClick={() => setSelectedStepInBeat(stepInBeat)}
                >
                  <span>{label}</span>
                  <small>
                    {event
                      ? event.eventType === "hit"
                        ? "/"
                        : event.eventType === "rest"
                          ? "—"
                          : "⌒"
                      : sustainingEvent
                        ? "━"
                        : "·"}
                  </small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Beat Event</span>
          <div
            className="progressionApplyTabs progressionEventTabs"
            role="group"
            aria-label="拍の発音状態"
          >
            {(selectedStepInBeat === 0
              ? (["hit", "rest", "tie"] as const)
              : (["empty", "hit", "rest"] as const)
            ).map((eventType) => {
              const isActive = selectedBeatEventType === eventType;
              const isDisabled = eventType === "tie" && !canTieSelectedBeat;
              return (
                <button
                  key={eventType}
                  type="button"
                  className={isActive ? "active" : ""}
                  aria-pressed={isActive}
                  disabled={isDisabled}
                  title={isDisabled ? "Tieには直前のHitが必要です" : undefined}
                  onClick={() => {
                    if (eventType === "empty") {
                      onRhythmEventRemove(selectedBarIndex, selectedStartStep);
                    } else if (selectedStepInBeat === 0) {
                      onBeatEventTypeChange(selectedBarIndex, selectedBeatIndex, eventType);
                    } else {
                      onRhythmEventChange(
                        selectedBarIndex,
                        selectedStartStep,
                        eventType,
                        selectedRhythmEvent?.durationSteps ?? 1,
                      );
                    }
                  }}
                >
                  {eventType === "empty"
                    ? "Empty"
                    : eventType === "hit"
                      ? "Hit"
                      : eventType === "rest"
                        ? "Rest"
                        : "Tie"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Note Value</span>
          <div
            className="progressionApplyTabs progressionDurationTabs"
            role="group"
            aria-label="拍の音価"
          >
            {(
              [
                { steps: 1, label: "1/16" },
                { steps: 2, label: "1/8" },
                { steps: 3, label: "1/8 ·" },
                { steps: 4, label: "1/4" },
                { steps: 6, label: "1/4 ·" },
              ] as const
            ).map((option) => {
              const isActive = selectedBeatDuration === option.steps;
              const canUseDuration = canSetProgressionRhythmDuration(
                selectedBar,
                selectedStartStep,
                option.steps,
                bars[(selectedBarIndex + 1) % bars.length],
              );
              return (
                <button
                  key={option.steps}
                  type="button"
                  className={isActive ? "active" : ""}
                  aria-pressed={isActive}
                  disabled={selectedBeatEventType !== "hit" || !canUseDuration}
                  onClick={() => {
                    if (selectedStepInBeat === 0) {
                      onBeatDurationChange(selectedBarIndex, selectedBeatIndex, option.steps);
                    } else {
                      onRhythmEventChange(
                        selectedBarIndex,
                        selectedStartStep,
                        "hit",
                        option.steps,
                      );
                    }
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionApplySection">
          <span className="controlLabel">Apply To</span>
          <div className="progressionApplyTabs" role="group" aria-label="コードの適用範囲">
            <button
              type="button"
              className={editScope === "cell" ? "active" : ""}
              aria-pressed={editScope === "cell"}
              onClick={useCellScope}
            >
              Beats {selectedCellIndex === 0 ? "1-2" : "3-4"}
            </button>
            <button
              type="button"
              className={editScope === "beat" ? "active" : ""}
              aria-pressed={editScope === "beat"}
              onClick={useBeatScope}
            >
              Beat {selectedBeatIndex + 1} only
            </button>
          </div>
        </div>

        <div className="progressionChipSection">
          <span className="controlLabel">Root</span>
          <div className="progressionChipGrid progressionRootChips" role="group" aria-label="Root">
            {roots.map((root) => {
              const isSelected = selectedCell.root === root;
              return (
                <button
                  key={root}
                  type="button"
                  className={isSelected ? "progressionChip active" : "progressionChip"}
                  aria-pressed={isSelected}
                  onClick={() => applyCellChange({ ...selectedCell, root })}
                >
                  {root}
                </button>
              );
            })}
          </div>
        </div>

        <div className="progressionChipSection">
          <span className="controlLabel">Chord</span>
          <div className="progressionChipGrid progressionChordChips" role="group" aria-label="Chord">
            {chordTypes.map((chordType) => {
              const isSelected = selectedCell.chordTypeId === chordType.id;
              return (
                <button
                  key={chordType.id}
                  type="button"
                  className={isSelected ? "progressionChip active" : "progressionChip"}
                  aria-pressed={isSelected}
                  title={chordType.name}
                  onClick={() =>
                    applyCellChange({
                      ...selectedCell,
                      chordTypeId: chordType.id,
                    })
                  }
                >
                  {formatChordTypeSymbol(chordType.id, chordTypes)}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
