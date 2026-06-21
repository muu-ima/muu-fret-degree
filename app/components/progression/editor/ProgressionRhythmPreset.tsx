import type { ProgressionRhythmPreset } from "../../../lib/progression";

type ProgressionRhythmPresetProps = {
  onApply: (preset: ProgressionRhythmPreset) => void;
  selectedPreset: ProgressionRhythmPreset | undefined;
};

export function ProgressionRhythmPreset({
  onApply,
  selectedPreset,
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
              { value: "dotted-quarter-eighth", label: "Dotted 1/4 + 1/8" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={selectedPreset === option.value ? "active" : ""}
              aria-pressed={selectedPreset === option.value}
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
