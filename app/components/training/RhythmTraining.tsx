"use client";

import { useRhythmTraining } from "../../hooks/training/useRhythmTraining";
import { RhythmTrainingSettings } from "./RhythmTrainingSettings";
import { RhythmTrainingPlayer } from "./RhythmTrainingPlayer";
import styles from "./RhythmTraining.module.css";

export function RhythmTraining({ isActive = true }: { isActive?: boolean }) {
  const training = useRhythmTraining(isActive);

  return (
    <section className={styles.training} aria-labelledby="rhythm-training-title">
      <header className={styles.header}>
        <div>
          <p className="panelEyebrow">Rhythm Training</p>
          <h2 id="rhythm-training-title">リズム聴き比べ</h2>
          <p className={styles.description}>音の間隔を聴いて、リズムの違いを感じる練習。</p>
        </div>
        <span className={styles.badge}>4/4 · Loop</span>
      </header>
      <div className={styles.layout}>
        <RhythmTrainingSettings
          selectedPulses={training.selectedPulses}
          measuresPerPattern={training.measuresPerPattern}
          isRunning={training.isRunning}
          onTogglePattern={training.togglePattern}
          onMeasuresChange={training.changeMeasures}
        />
        <RhythmTrainingPlayer
          bpmInput={training.bpmInput}
          onBpmInputChange={training.setBpmInput}
          onBpmCommit={training.commitBpm}
          accentEnabled={training.accentEnabled}
          onAccentChange={training.changeAccent}
          selectedPatterns={training.selectedPatterns}
          measuresPerPattern={training.measuresPerPattern}
          position={training.position}
          isRunning={training.isRunning}
          onToggle={() => training.isRunning ? training.stop() : void training.start()}
        />
      </div>
      {training.error && <p className={styles.error} role="alert">{training.error}</p>}
    </section>
  );
}
