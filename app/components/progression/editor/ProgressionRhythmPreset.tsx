import type { ProgressionSubdivision } from "../../../lib/progression";

type ProgressionRhythmPresetProps = {
  onApply: (subdivision: ProgressionSubdivision) => void;
  selectedSubdivision: ProgressionSubdivision | undefined;
};

export function ProgressionRhythmPreset({
  onApply,
  selectedSubdivision,
}: ProgressionRhythmPresetProps) {
  return (
    <div className="progressionRhythmPresetSection">
      <div className="progressionApplySection">
        <span className="controlLabel">Rhythm Preset</span>
        <div
          className="progressionApplyTabs progressionSubdivisionTabs"
          role="group"
          aria-label="拍の分割プリセット"
        >
          {(
            [
              { value: "quarters", label: "Quarter ×1" },
              { value: "eighths", label: "8ths ×2" },
              { value: "sixteenths", label: "16ths ×4" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={selectedSubdivision === option.value ? "active" : ""}
              aria-pressed={selectedSubdivision === option.value}
              onClick={() => onApply(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
