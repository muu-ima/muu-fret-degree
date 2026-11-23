import { type FormEvent, useMemo, useState } from "react";
import { buildAudioChordChart, formatAudioTime, type AudioChartGrid } from "../../lib/audio-chord-chart";
import { getAudioChordSelection, type AudioChordAnalysis, type AudioChordSelection } from "../../lib/audio-chords";
import styles from "./AudioChordImport.module.css";

type AudioChordChartProps = {
  analysis: AudioChordAnalysis;
  fallbackBpm: number;
  onSelect: (chord: AudioChordSelection) => void;
};

export function AudioChordChart({ analysis, fallbackBpm, onSelect }: AudioChordChartProps) {
  const { segments, duration, timing } = analysis;
  const maxFirstBarStart = Math.max(0, (Math.ceil(duration * 1000) - 1) / 1000);
  const [grid, setGrid] = useState<AudioChartGrid>(() => ({
    bpm: timing?.bpm ?? fallbackBpm,
    beatsPerBar: 4,
    firstBarStart: Math.min(maxFirstBarStart, Number((timing?.firstBarStart ?? 0).toFixed(3))),
  }));
  const [isManual, setIsManual] = useState(false);
  const { bars, count } = useMemo(() => buildAudioChordChart(segments, duration, grid), [segments, duration, grid]);

  function applyGrid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setGrid({
      bpm: Number(fields.get("bpm")),
      beatsPerBar: Number(fields.get("beatsPerBar")),
      firstBarStart: Number(fields.get("firstBarStart")),
    });
    setIsManual(true);
  }

  return (
    <section className={styles.chart} aria-labelledby="audio-chord-chart-title">
      <div className={styles.chartHeader}>
        <h3 id="audio-chord-chart-title">コード譜</h3>
        <span role="status">
          <strong>全{count}小節</strong>
          <span className={styles.timingSource}>{isManual ? "手動設定" : timing ? "推定" : "仮の区切り"}</span>
        </span>
      </div>
      <form className={styles.gridForm} onSubmit={applyGrid}>
        <label>
          BPM
          <input type="number" name="bpm" min="1" max="400" step="any" defaultValue={grid.bpm} required />
        </label>
        <label>
          1小節の拍数
          <input type="number" name="beatsPerBar" min="1" max="16" defaultValue={grid.beatsPerBar} required />
        </label>
        <label>
          最初の小節頭（秒）
          <input
            type="number"
            name="firstBarStart"
            min="0"
            max={maxFirstBarStart}
            step="0.001"
            defaultValue={grid.firstBarStart}
            required
          />
        </label>
        <button type="submit" className={styles.applyGrid}>小節を更新</button>
      </form>
      <ol className={styles.bars} aria-label="小節ごとのコード">
        {bars.map(({ number, start, partial, chords }) => (
          <li key={number} className={styles.bar}>
            <div className={styles.barHeader}>
              <strong>{number === 0 ? "小節前" : `${number}小節目`}</strong>
              <span className={styles.time}>{formatAudioTime(start)}</span>
            </div>
            {number > 0 && partial && <span className={styles.partial}>途中まで</span>}
            <div className={styles.barChords}>
              {chords.map(({ segment, start }) => {
                const chord = getAudioChordSelection(segment);
                return chord ? (
                  <button
                    key={start}
                    type="button"
                    className={styles.barChord}
                    title={formatAudioTime(start)}
                    onClick={() => onSelect(chord)}
                  >
                    {segment.label}
                  </button>
                ) : <span key={start} className={styles.noChord}>コードなし</span>;
              })}
              {!chords.length && <span className={styles.noChord}>コードなし</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
