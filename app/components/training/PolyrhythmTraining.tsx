"use client";

import { LuPlay, LuSquare, LuVolume2, LuVolumeX } from "react-icons/lu";
import { usePolyrhythmTraining } from "../../hooks/training/usePolyrhythmTraining";
import { getPolyrhythmPulses, polyrhythmRatios } from "../../lib/polyrhythm";
import { TrainingDial } from "./TrainingDial";
import shared from "./RhythmTraining.module.css";
import styles from "./PolyrhythmTraining.module.css";

const lanes = [
  { id: "high", name: "高い音", cue: "手でたたく" },
  { id: "low", name: "低い音", cue: "足で刻む" },
] as const;

export function PolyrhythmTraining({ isActive }: { isActive: boolean }) {
  const player = usePolyrhythmTraining(isActive);
  const pulses = getPolyrhythmPulses(player.ratio);

  return (
    <section className={shared.training} aria-labelledby="polyrhythm-title">
      <header className={shared.header}>
        <div>
          <h2 id="polyrhythm-title">ポリリズム</h2>
          <p className={styles.description}>同じ長さのループを違う数に分けて、2つのリズムを重ねます。</p>
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.controls}>
          <fieldset className={styles.ratios} disabled={player.isRunning}>
            <legend>リズムの比率</legend>
            <div>
              {polyrhythmRatios.map((ratio) => (
                <button
                  key={ratio.label}
                  type="button"
                  aria-pressed={player.ratio === ratio}
                  onClick={() => player.changeRatio(ratio)}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </fieldset>
          <TrainingDial label="低い音のテンポ" unit="BPM" value={player.bpm} min={40} max={240} onChange={player.changeBpm} />
          <button
            className={shared.playButton}
            type="button"
            onClick={() => player.isRunning ? player.stop() : void player.start()}
          >
            {player.isRunning ? <LuSquare aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
            {player.isRunning ? "停止" : "再生"}
          </button>
        </div>
        <div className={styles.diagram}>
          <div className={styles.labels}>
            {lanes.map(({ id, name, cue }) => (
              <div className={styles.laneLabel} data-lane={id} key={id}>
                <div>
                  <strong>{name} · {player.ratio[id]}打</strong>
                  <span>{cue}</span>
                </div>
                <button
                  type="button"
                  aria-label={`${name}の再生`}
                  aria-pressed={player.audible[id]}
                  className={styles.mute}
                  onClick={() => player.toggleLane(id)}
                >
                  {player.audible[id] ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
          <div className={styles.tracks} ref={player.trackRef} aria-hidden="true">
            <div className={styles.trackCaption}><span>2つの音がそろう</span><span>次のループ</span></div>
            <div className={styles.lines}>
              {lanes.map(({ id }) => (
                <div className={styles.lane} data-lane={id} data-muted={!player.audible[id]} key={id}>
                  {pulses.map((pulse) => pulse[id] === null ? null : (
                    <span
                      key={pulse[id]}
                      className={styles.pulse}
                      style={{ left: `${pulse.progress * 100}%` }}
                      data-hit={player.hit?.[id] === pulse[id]}
                    >
                      {pulse[id] + 1}
                    </span>
                  ))}
                  <span className={styles.restart} />
                </div>
              ))}
              {player.isRunning && <div className={styles.playhead} />}
            </div>
          </div>
        </div>
        <p className={styles.description}>まず低い音だけで足を動かし、そのまま高い音を重ねて手でたたいてみましょう。</p>
        {player.error && <p className={styles.error} role="alert">{player.error}</p>}
      </div>
    </section>
  );
}
