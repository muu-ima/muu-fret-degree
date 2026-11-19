import type { getRhythmTrainingBeat, RhythmTrainingMeasures, rhythmTrainingPatterns } from "../../lib/rhythm-training";
import styles from "./RhythmTraining.module.css";

type Pattern = typeof rhythmTrainingPatterns[number];
type Props = {
  selectedPatterns: readonly Pattern[];
  measuresPerPattern: RhythmTrainingMeasures;
  position: ReturnType<typeof getRhythmTrainingBeat>;
  isRunning: boolean;
};

export function RhythmTrainingReadout({ selectedPatterns, measuresPerPattern, position, isRunning }: Props) {
  const current = isRunning ? position.pattern : selectedPatterns[0];
  const index = selectedPatterns.findIndex((pattern) => pattern.pulses === current.pulses);
  const next = selectedPatterns[(index + 1) % selectedPatterns.length];
  const single = selectedPatterns.length === 1;

  return (
    <div className={styles.readout} data-running={isRunning}>
      <div className={styles.readoutHeading}>
        <span className={styles.status}>{isRunning ? "再生中" : "再生待ち"}</span>
        <span className={styles.subdivision}>1拍に{current.pulses}音</span>
      </div>
      <strong className={styles.currentPattern}>{current.label}</strong>
      <div className={styles.positionSummary}>
        <div><span>拍</span><strong>{isRunning ? position.beat : "—"}<small> / 4</small></strong></div>
        <div><span>小節</span><strong>{isRunning ? position.measure : "—"}<small> / {measuresPerPattern}</small></strong></div>
      </div>
      <div className={styles.measureProgress} aria-hidden="true">
        {Array.from({ length: measuresPerPattern }, (_, measureIndex) => {
          const measure = measureIndex + 1;
          return (
            <div key={measure} className={styles.progressMeasure}
              data-current={isRunning && measure === position.measure}>
              <span>{measure}</span>
              <div>
                {[1, 2, 3, 4].map((beat) => {
                  const active = isRunning && measure === position.measure && beat === position.beat;
                  const passed = isRunning && (measure < position.measure || (measure === position.measure && beat < position.beat));
                  return <i key={beat} data-current={active} data-passed={passed} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.upNext}>
        <span>{isRunning ? single ? "このあとも" : "次のリズム" : "再生すると"}</span>
        <strong>{isRunning ? next.label : current.label}</strong>
        <small>{isRunning ? single ? `${measuresPerPattern}小節ずつ繰り返し` : `${measuresPerPattern}小節目のあとに切り替え` : "1小節目・1拍目からスタート"}</small>
      </div>
    </div>
  );
}
