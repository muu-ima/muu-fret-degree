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
        <span className="controlLabel">Rhythm Preset</span>
        <div
          className="progressionApplyTabs progressionSubdivisionTabs"
          role="group"
          aria-label="拍の分割プリセット"
        >
          {progressionRhythmPresets.map((preset) => {
            const isSupportedPreset = preset.timingGrid === "sixteenth";

            return (
              <button
                key={preset.id}
                type="button"
                className={[
                  selectedPreset === preset.id ? "active" : "",
                  preset.spanBeats > 1 ? "wide" : "",
                ].filter(Boolean).join(" ")}
                disabled={!isSupportedPreset}
                title={isSupportedPreset ? undefined : "まだ保存形式が未対応です"}
                aria-pressed={selectedPreset === preset.id}
                onClick={() => onApply(preset.id)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
