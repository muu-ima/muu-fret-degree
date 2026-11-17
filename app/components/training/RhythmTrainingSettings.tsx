import { useId } from "react";
import {
  rhythmTrainingPatterns,
  rhythmTrainingMeasureOptions,
  type RhythmTrainingMeasures,
  type RhythmTrainingPulse,
} from "../../lib/rhythm-training";
import styles from "./RhythmTraining.module.css";

type Props = {
  selectedPulses: readonly RhythmTrainingPulse[];
  measuresPerPattern: RhythmTrainingMeasures;
  isRunning: boolean;
  onTogglePattern: (pulse: RhythmTrainingPulse) => void;
  onMeasuresChange: (measures: RhythmTrainingMeasures) => void;
};

export function RhythmTrainingSettings({
  selectedPulses, measuresPerPattern, isRunning, onTogglePattern, onMeasuresChange,
}: Props) {
  const id = useId();

  return (
    <div className={styles.settings}>
      <fieldset className={styles.fieldset} aria-describedby={`${id}-rhythms-help`}>
        <legend>練習するリズム</legend>
        <p id={`${id}-rhythms-help`} className={styles.help}>1種類なら単独ループ。複数なら表示順に再生します。</p>
        <ol className={styles.patterns} aria-label="リズムの選択と再生順">
          {rhythmTrainingPatterns.map((pattern) => {
            const selected = selectedPulses.includes(pattern.pulses);
            return (
              <li key={pattern.pulses}>
                <label className={`${styles.pattern} ${selected ? styles.selected : ""}`}>
                  <input type="checkbox" checked={selected}
                    disabled={isRunning || (selected && selectedPulses.length === 1)}
                    onChange={() => onTogglePattern(pattern.pulses)} />
                  <strong>{pattern.label}</strong>
                  <span className={styles.patternDetail}>1拍に{pattern.pulses}音</span>
                  <span className={styles.pulsePreview} aria-hidden="true">
                    {Array.from({ length: pattern.pulses }, (_, index) => <i key={index} />)}
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend>切り替え小節数</legend>
        <div className={styles.measureOptions}>
          {rhythmTrainingMeasureOptions.map((measures) => (
            <label key={measures} className={styles.measureOption}>
              <input type="radio" name={`${id}-measures`} value={measures}
                checked={measuresPerPattern === measures} disabled={isRunning}
                onChange={() => onMeasuresChange(measures)} />
              <span>{measures}<small>小節</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className={styles.help}>
        {isRunning ? "リズムと小節数を変えるには、再生を停止してください。" : "最低1種類を選択してください。リズムと小節数は停止中に変更できます。"}
      </p>
    </div>
  );
}
