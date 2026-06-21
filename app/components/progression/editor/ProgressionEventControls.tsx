import type {
  ProgressionBeatEventType,
  ProgressionPlacementValidation,
} from "../../../lib/progression";
import { getPlacementValidationMessage } from "./rhythmEditorOptions";

type EditableEventType = ProgressionBeatEventType | "empty";

type ProgressionEventControlsProps = {
  canTie: boolean;
  onChange: (eventType: EditableEventType) => void;
  placementValidation: ProgressionPlacementValidation;
  selectedEventType: ProgressionBeatEventType | undefined;
  selectedStepInBeat: number;
};

export function ProgressionEventControls({
  canTie,
  onChange,
  placementValidation,
  selectedEventType,
  selectedStepInBeat,
}: ProgressionEventControlsProps) {
  const eventTypes: readonly EditableEventType[] =
    selectedStepInBeat === 0 ? ["hit", "rest", "tie"] : ["empty", "hit", "rest"];

  return (
    <div className="progressionApplySection">
      <span className="controlLabel">Beat Event</span>
      <div
        className="progressionApplyTabs progressionEventTabs"
        role="group"
        aria-label="拍の発音状態"
      >
        {eventTypes.map((eventType) => {
          const isTieDisabled = eventType === "tie" && !canTie;
          const isPlacementDisabled = eventType !== "empty" && !placementValidation.canPlace;
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
              onClick={() => onChange(eventType)}
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
  );
}
