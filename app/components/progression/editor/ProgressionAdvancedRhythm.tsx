import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPlacementValidation,
} from "../../../lib/progression";
import { useProgressionRhythmEditing } from "../../../hooks/progression/useProgressionRhythmEditing";
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
  const {
    canTie,
    changeDuration,
    changeEventType,
    placementValidation,
    selectedDuration,
    selectedEventLabel,
    selectedEventType,
    validateDuration,
  } = useProgressionRhythmEditing({
    bars,
    onBeatDurationChange,
    onBeatEventTypeChange,
    onRhythmEventChange,
    onRhythmEventRemove,
    selectedBar,
    selectedBarIndex,
    selectedBeatIndex,
    selectedStepInBeat,
    validateRhythmPlacement,
  });
  const selectedDurationLabel = progressionDurationOptions.find(
    (option) => option.steps === selectedDuration,
  )?.label;
  const selectedStepLabel = progressionStepOptions[selectedStepInBeat].label;

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
          Position {selectedStepLabel} · {selectedEventLabel}
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
              canTie={canTie}
              onChange={changeEventType}
              placementValidation={placementValidation}
              selectedEventType={selectedEventType}
              selectedStepInBeat={selectedStepInBeat}
            />
            <ProgressionDurationControls
              onChange={changeDuration}
              selectedDuration={selectedDuration}
              selectedEventType={selectedEventType}
              validate={validateDuration}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
