import type {
  ProgressionBeatEventType,
  ProgressionDurationSteps,
  ProgressionPlacementValidation,
} from "../../../lib/progression";
import {
  getPlacementValidationMessage,
  progressionDurationOptions,
} from "./rhythmEditorOptions";

type ProgressionDurationControlsProps = {
  onChange: (durationSteps: ProgressionDurationSteps) => void;
  selectedDuration: ProgressionDurationSteps;
  selectedEventType: ProgressionBeatEventType | undefined;
  validate: (durationSteps: ProgressionDurationSteps) => ProgressionPlacementValidation;
};

export function ProgressionDurationControls({
  onChange,
  selectedDuration,
  selectedEventType,
  validate,
}: ProgressionDurationControlsProps) {
  return (
    <div className="progressionApplySection">
      <span className="controlLabel">Note Value</span>
      <div
        className="progressionApplyTabs progressionDurationTabs"
        role="group"
        aria-label="拍の音価"
      >
        {progressionDurationOptions.map((option) => {
          const placementValidation = validate(option.steps);
          return (
            <button
              key={option.steps}
              type="button"
              className={selectedDuration === option.steps ? "active" : ""}
              aria-pressed={selectedDuration === option.steps}
              disabled={selectedEventType !== "hit" || !placementValidation.canPlace}
              title={getPlacementValidationMessage(placementValidation)}
              onClick={() => onChange(option.steps)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
