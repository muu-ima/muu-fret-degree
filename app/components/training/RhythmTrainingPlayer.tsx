import { LuPlay, LuSquare } from "react-icons/lu";
import type { RhythmTrainingController } from "../../hooks/training/useRhythmTraining";
import { RhythmTrainingReadout } from "./RhythmTrainingReadout";
import styles from "./RhythmTraining.module.css";

type Props = Pick<RhythmTrainingController,
  "bpmInput" | "accentEnabled" | "selectedPatterns" | "measuresPerPattern" | "position" | "isRunning"
> & {
  onBpmInputChange: (value: string) => void;
  onBpmCommit: (value: string) => void;
  onAccentChange: (enabled: boolean) => void;
  onToggle: () => void;
};

export function RhythmTrainingPlayer({
  bpmInput, onBpmInputChange, onBpmCommit, accentEnabled, onAccentChange,
  selectedPatterns, measuresPerPattern, position, isRunning, onToggle,
}: Props) {
  return (
    <div className={styles.player}>
      <div className={styles.tempoRow}>
        <label className={styles.tempo}>
          <span>BPM <small>四分音符</small></span>
          <input type="number" min="40" max="240" step="1" value={bpmInput}
            onChange={(event) => onBpmInputChange(event.target.value)}
            onBlur={(event) => onBpmCommit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onBpmCommit(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }} />
        </label>
        <button type="button" className={styles.playButton} onClick={onToggle}>
          {isRunning ? <LuSquare aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
          {isRunning ? "停止" : "再生"}
        </button>
      </div>
      <p className={styles.help}>40–240 BPM · 再生中も変更できます</p>
      <label className={styles.accent}>
        <input type="checkbox" checked={accentEnabled} onChange={(event) => onAccentChange(event.target.checked)} />
        <span>拍の頭にアクセント<small>オフですべての音が均等</small></span>
      </label>
      <RhythmTrainingReadout
        selectedPatterns={selectedPatterns}
        measuresPerPattern={measuresPerPattern}
        position={position}
        isRunning={isRunning}
      />
      <div className={styles.sequence}>
        <span className={styles.status}>再生順</span>
        <ol>
          {selectedPatterns.map((pattern) => (
            <li key={pattern.pulses} aria-current={isRunning && position.pattern.pulses === pattern.pulses ? "step" : undefined}>
              {pattern.label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
