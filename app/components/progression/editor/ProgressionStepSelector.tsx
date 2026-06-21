import {
  getProgressionRhythmEventAtStep,
  getProgressionSustainingEventAtStep,
  progressionStepsPerBeat,
  type ProgressionBar,
} from "../../../lib/progression";
import { progressionStepOptions } from "./rhythmEditorOptions";

type ProgressionStepSelectorProps = {
  beatIndex: number;
  onChange: (stepInBeat: number) => void;
  selectedBar: ProgressionBar;
  selectedStepInBeat: number;
};

export function ProgressionStepSelector({
  beatIndex,
  onChange,
  selectedBar,
  selectedStepInBeat,
}: ProgressionStepSelectorProps) {
  return (
    <div className="progressionStepSection">
      <span className="controlLabel">Start Position</span>
      <div className="progressionStepTabs" role="tablist" aria-label="編集する開始位置">
        {progressionStepOptions.map(({ label, stepInBeat }) => {
          const startStep = beatIndex * progressionStepsPerBeat + stepInBeat;
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
              onClick={() => onChange(stepInBeat)}
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
  );
}
