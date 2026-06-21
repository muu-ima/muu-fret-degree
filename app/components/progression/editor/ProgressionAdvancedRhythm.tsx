import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  canTieProgressionBeat,
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionRhythmEventAtStep,
  getProgressionSustainingEventAtStep,
  progressionStepsPerBeat,
  type ProgressionBar,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPlacementValidation,
} from "../../../lib/progression";

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

const durationOptions = [
  { steps: 1, label: "1/16" },
  { steps: 2, label: "1/8" },
  { steps: 3, label: "1/8 ·" },
  { steps: 4, label: "1/4" },
  { steps: 6, label: "1/4 ·" },
] as const;

const stepOptions = [
  { label: "1", stepInBeat: 0 },
  { label: "e", stepInBeat: 1 },
  { label: "&", stepInBeat: 2 },
  { label: "a", stepInBeat: 3 },
] as const;

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
  const selectedDurationLabel = durationOptions.find(
    (option) => option.steps === selectedDuration,
  )?.label;
  const canTieSelectedBeat = canTieProgressionBeat(
    bars,
    selectedBarIndex,
    selectedBeatIndex,
  );

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
          Position {stepOptions[selectedStepInBeat].label} · {selectedEventLabel}
          {selectedEventType === "hit" ? ` · ${selectedDurationLabel}` : ""}
        </small>
        <LuChevronDown aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id="progression-advanced-rhythm" className="progressionRhythmAccordionContent">
          <div className="progressionStepSection">
            <span className="controlLabel">Start Position</span>
            <div className="progressionStepTabs" role="tablist" aria-label="編集する開始位置">
              {stepOptions.map(({ label, stepInBeat }) => {
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
                    onClick={() => onStepChange(stepInBeat)}
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
                  const placementValidation = validateRhythmPlacement(
                    selectedBarIndex,
                    selectedStartStep,
                    selectedDuration,
                  );
                  const isTieDisabled = eventType === "tie" && !canTieSelectedBeat;
                  const isPlacementDisabled =
                    eventType !== "empty" && !placementValidation.canPlace;
                  return (
                    <button
                      key={eventType}
                      type="button"
                      className={selectedEventType === eventType ? "active" : ""}
                      aria-pressed={selectedEventType === eventType}
                      disabled={isTieDisabled || isPlacementDisabled}
                      title={
                        isTieDisabled
                          ? "Tieには直前のHitが必要です"
                          : isPlacementDisabled
                            ? getPlacementValidationMessage(placementValidation)
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
                {durationOptions.map((option) => {
                  const placementValidation = validateRhythmPlacement(
                    selectedBarIndex,
                    selectedStartStep,
                    option.steps,
                  );
                  return (
                    <button
                      key={option.steps}
                      type="button"
                      className={selectedDuration === option.steps ? "active" : ""}
                      aria-pressed={selectedDuration === option.steps}
                      disabled={selectedEventType !== "hit" || !placementValidation.canPlace}
                      title={getPlacementValidationMessage(placementValidation)}
                      onClick={() => {
                        if (selectedStepInBeat === 0) {
                          onBeatDurationChange(
                            selectedBarIndex,
                            selectedBeatIndex,
                            option.steps,
                          );
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
  );
}
