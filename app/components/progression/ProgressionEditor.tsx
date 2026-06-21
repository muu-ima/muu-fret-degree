"use client";

import { useEffect, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { type ChordType } from "../../lib/music";
import {
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
  type ProgressionPlacementValidation,
  type ProgressionSubdivision,
} from "../../lib/progression";
import { ProgressionChordChart } from "./ProgressionChordChart";
import { ProgressionEditorHeader } from "./editor/ProgressionEditorHeader";
import { ProgressionHarmonyEditor } from "./editor/ProgressionHarmonyEditor";
import { ProgressionRhythmPreset } from "./editor/ProgressionRhythmPreset";
import { ProgressionSelectionHeader } from "./editor/ProgressionSelectionHeader";

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
  validateRhythmPlacement: (
    barIndex: number,
    startStep: number,
    durationSteps: ProgressionDurationSteps,
  ) => ProgressionPlacementValidation;
};

function getPlacementValidationMessage(validation: ProgressionPlacementValidation) {
  if (validation.canPlace) {
    return undefined;
  }
  if (validation.reason === "occupied-by-prior-event") {
    return "この位置は先行イベントの音価内です";
  }
  if (validation.reason === "overlaps-following-event") {
    return "この音価は後続イベントと重なります";
  }
  return "この位置にはイベントを配置できません";
}

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
  validateRhythmPlacement,
}: ProgressionEditorProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepInBeat, setSelectedStepInBeat] = useState(0);
  const [isAdvancedRhythmOpen, setIsAdvancedRhythmOpen] = useState(false);

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
  const selectedPositionLabel = ["1", "e", "&", "a"][selectedStepInBeat];
  const selectedEventLabel = selectedBeatEventType
    ? selectedBeatEventType[0].toUpperCase() + selectedBeatEventType.slice(1)
    : "Empty";
  const selectedDurationLabel =
    ({ 1: "1/16", 2: "1/8", 3: "1/8 ·", 4: "1/4", 6: "1/4 ·" } as const)[
      selectedBeatDuration
    ];
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
      <ProgressionEditorHeader
        barCount={barCount}
        barCountOptions={barCountOptions}
        onBarCountChange={onBarCountChange}
      />
      <ProgressionChordChart
        bars={bars}
        chordTypes={chordTypes}
        selectedBarIndex={selectedBarIndex}
        selectedBeatIndex={selectedBeatIndex}
        selectedStepInBeat={selectedStepInBeat}
        onBeatSelect={selectBeat}
      />
      <section className="progressionSelectionEditor" aria-label="選択中のコードを編集">
        <ProgressionSelectionHeader
          barNumber={selectedBar.bar}
          beatIndex={selectedBeatIndex}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
          selectedCell={selectedCell}
          stepInBeat={selectedStepInBeat}
        />

        <ProgressionHarmonyEditor
          beatIndex={selectedBeatIndex}
          cellIndex={selectedCellIndex}
          chordTypes={chordTypes}
          editScope={editScope}
          onBeatSelect={(beatIndex) => selectBeat(selectedBarIndex, beatIndex)}
          onCellChange={applyCellChange}
          onUseBeatScope={useBeatScope}
          onUseCellScope={useCellScope}
          roots={roots}
          selectedCell={selectedCell}
        />

        <ProgressionRhythmPreset
          onApply={applySubdivision}
          selectedSubdivision={selectedSubdivision}
        />

        <section className={`progressionRhythmAccordion${isAdvancedRhythmOpen ? " open" : ""}`}>
          <button
            type="button"
            className="progressionRhythmAccordionTrigger"
            aria-expanded={isAdvancedRhythmOpen}
            aria-controls="progression-advanced-rhythm"
            onClick={() => setIsAdvancedRhythmOpen((isOpen) => !isOpen)}
          >
            <span>Advanced Rhythm</span>
            <small>
              Position {selectedPositionLabel} · {selectedEventLabel}
              {selectedBeatEventType === "hit" ? ` · ${selectedDurationLabel}` : ""}
            </small>
            <LuChevronDown aria-hidden="true" />
          </button>

          {isAdvancedRhythmOpen ? (
            <div id="progression-advanced-rhythm" className="progressionRhythmAccordionContent">
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

        <div className="progressionRhythmControlGrid progressionRhythmEventGrid">
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
              const placementValidation = validateRhythmPlacement(
                selectedBarIndex,
                selectedStartStep,
                selectedBeatDuration,
              );
              const placementMessage = getPlacementValidationMessage(placementValidation);
              const isTieDisabled = eventType === "tie" && !canTieSelectedBeat;
              const isPlacementDisabled = eventType !== "empty" && !placementValidation.canPlace;
              const isDisabled = isTieDisabled || isPlacementDisabled;
              return (
                <button
                  key={eventType}
                  type="button"
                  className={isActive ? "active" : ""}
                  aria-pressed={isActive}
                  disabled={isDisabled}
                  title={
                    isTieDisabled
                      ? "Tieには直前のHitが必要です"
                      : isPlacementDisabled
                        ? placementMessage
                        : undefined
                  }
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
              const placementValidation = validateRhythmPlacement(
                selectedBarIndex,
                selectedStartStep,
                option.steps,
              );
              const placementMessage = getPlacementValidationMessage(placementValidation);
              return (
                <button
                  key={option.steps}
                  type="button"
                  className={isActive ? "active" : ""}
                  aria-pressed={isActive}
                  disabled={selectedBeatEventType !== "hit" || !placementValidation.canPlace}
                  title={!placementValidation.canPlace ? placementMessage : undefined}
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

              </div>
            </div>
          ) : null}
        </section>

      </section>
    </section>
  );
}
