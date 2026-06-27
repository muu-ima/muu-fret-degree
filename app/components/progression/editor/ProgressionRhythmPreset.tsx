import {
  progressionRhythmPresets,
  type ProgressionRhythmPresetId,
} from "../../../lib/progression";

type ProgressionRhythmPresetProps = {
  onApply: (preset: ProgressionRhythmPresetId) => void;
  selectedPreset: ProgressionRhythmPresetId | undefined;
};

export function ProgressionRhythmPreset({
  onApply,
  selectedPreset,
}: ProgressionRhythmPresetProps) {
  return (
    <div className="progressionRhythmPresetSection">
      <div className="progressionApplySection">
        <span className="controlLabel">リズムプリセット</span>
        <small className="progressionRhythmPresetHint">
          16分系と3連系を切り替えられます
        </small>
        <div
          className="progressionApplyTabs progressionSubdivisionTabs"
          role="group"
          aria-label="拍の分割プリセット"
        >
          {progressionRhythmPresets.map((preset) => {
            return (
              <button
                key={preset.id}
                type="button"
                className={[
                  selectedPreset === preset.id ? "active" : "",
                ].filter(Boolean).join(" ")}
                aria-pressed={selectedPreset === preset.id}
                onClick={() => onApply(preset.id)}
              >
                <span className="progressionPresetLabel">{preset.label}</span>
                <span className="progressionPresetDescription">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
