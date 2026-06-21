import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  canTieProgressionBeat,
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionRhythmEventAtStep,
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPlacementValidation,
} from "../../../lib/progression";
import { ProgressionDurationControls } from "./ProgressionDurationControls";
import { ProgressionEventControls } from "./ProgressionEventControls";
import { ProgressionStepSelector } from "./ProgressionStepSelector";
import {
  progressionDurationOptions,
  progressionStepOptions,
} from "./rhythmEditorOptions";

type ProgressionAdvancedRhythmProps = {
  bars: readonly ProgressionBar[];
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
  onRhythmEventChange: (
    barIndex: number,
    startStep: number,
    eventType: ProgressionBeatEventType,
    durationSteps: ProgressionDurationSteps,
  ) => void;
  onRhythmEventRemove: (barIndex: number, startStep: number) => void;
  onStepChange: (stepInBeat: number) => void;
  selectedBar: ProgressionBar;
  selectedBarIndex: number;
  selectedBeatIndex: number;
  selectedStepInBeat: number;
  validateRhythmPlacement: (
    barIndex: number,
    startStep: number,
    durationSteps: ProgressionDurationSteps,
  ) => ProgressionPlacementValidation;
};

export function ProgressionAdvancedRhythm({
  bars,
  onBeatDurationChange,
  onBeatEventTypeChange,
  onRhythmEventChange,
  onRhythmEventRemove,
  onStepChange,
  selectedBar,
  selectedBarIndex,
  selectedBeatIndex,
  selectedStepInBeat,
  validateRhythmPlacement,
}: ProgressionAdvancedRhythmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedStartStep = selectedBeatIndex * progressionStepsPerBeat + selectedStepInBeat;
  const selectedRhythmEvent = getProgressionRhythmEventAtStep(selectedBar, selectedStartStep);
  const selectedEventType =
    selectedStepInBeat === 0
      ? getProgressionBeatEventType(selectedBar, selectedBeatIndex)
      : selectedRhythmEvent?.eventType;
  const selectedDuration =
    selectedStepInBeat === 0
      ? getProgressionBeatDuration(selectedBar, selectedBeatIndex)
      : selectedRhythmEvent?.durationSteps ?? 1;
  const selectedEventLabel = selectedEventType
    ? selectedEventType[0].toUpperCase() + selectedEventType.slice(1)
    : "Empty";
  const selectedDurationLabel = progressionDurationOptions.find(
    (option) => option.steps === selectedDuration,
  )?.label;
  const placementValidation = validateRhythmPlacement(
    selectedBarIndex,
    selectedStartStep,
    selectedDuration,
  );

  const changeEventType = (eventType: ProgressionBeatEventType | "empty") => {
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
  };

  const changeDuration = (durationSteps: ProgressionDurationSteps) => {
    if (selectedStepInBeat === 0) {
      onBeatDurationChange(selectedBarIndex, selectedBeatIndex, durationSteps);
    } else {
      onRhythmEventChange(selectedBarIndex, selectedStartStep, "hit", durationSteps);
    }
  };

  return (
    <section className={`progressionRhythmAccordion${isOpen ? " open" : ""}`}>
      <button
        type="button"
        className="progressionRhythmAccordionTrigger"
        aria-expanded={isOpen}
        aria-controls="progression-advanced-rhythm"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Advanced Rhythm</span>
        <small>
          Position {progressionStepOptions[selectedStepInBeat].label} · {selectedEventLabel}
          {selectedEventType === "hit" ? ` · ${selectedDurationLabel}` : ""}
        </small>
        <LuChevronDown aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id="progression-advanced-rhythm" className="progressionRhythmAccordionContent">
          <ProgressionStepSelector
            beatIndex={selectedBeatIndex}
            onChange={onStepChange}
            selectedBar={selectedBar}
            selectedStepInBeat={selectedStepInBeat}
          />
          <div className="progressionRhythmControlGrid progressionRhythmEventGrid">
            <ProgressionEventControls
              canTie={canTieProgressionBeat(bars, selectedBarIndex, selectedBeatIndex)}
              onChange={changeEventType}
              placementValidation={placementValidation}
              selectedEventType={selectedEventType}
              selectedStepInBeat={selectedStepInBeat}
            />
            <ProgressionDurationControls
              onChange={changeDuration}
              selectedDuration={selectedDuration}
              selectedEventType={selectedEventType}
              validate={(durationSteps) =>
                validateRhythmPlacement(selectedBarIndex, selectedStartStep, durationSteps)
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
