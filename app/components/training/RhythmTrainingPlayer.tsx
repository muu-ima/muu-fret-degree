import { LuPlay, LuSquare } from "react-icons/lu";
import type { RhythmTrainingController } from "../../hooks/training/useRhythmTraining";
import { RhythmTrainingReadout } from "./RhythmTrainingReadout";
import { TrainingDial } from "./TrainingDial";
import styles from "./RhythmTraining.module.css";

type Props = Pick<RhythmTrainingController,
  "bpm" | "accentEnabled" | "selectedPatterns" | "measuresPerPattern" | "position" | "isRunning"
> & {
  onBpmCommit: (value: string) => void;
  onAccentChange: (enabled: boolean) => void;
  onToggle: () => void;
};

export function RhythmTrainingPlayer({
  bpm, onBpmCommit, accentEnabled, onAccentChange,
  selectedPatterns, measuresPerPattern, position, isRunning, onToggle,
}: Props) {
  return (
    <div className={styles.player}>
      <div className={styles.tempoRow}>
        <TrainingDial label="テンポ（四分音符）" unit="BPM" value={bpm} min={40} max={240}
          onChange={(value) => onBpmCommit(String(value))} />
        <button type="button" className={styles.playButton} onClick={onToggle}>
          {isRunning ? <LuSquare aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
          {isRunning ? "停止" : "再生"}
        </button>
      </div>
      <p className={styles.help}>テンポは再生中も変更できます</p>
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
