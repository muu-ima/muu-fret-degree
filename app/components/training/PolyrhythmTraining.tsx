"use client";

import { LuPlay, LuSquare, LuVolume2, LuVolumeX } from "react-icons/lu";
import { usePolyrhythmTraining } from "../../hooks/training/usePolyrhythmTraining";
import { getPolyrhythmPulses, getPolyrhythmRests, polyrhythmRatios } from "../../lib/polyrhythm";
import { TrainingDial } from "./TrainingDial";
import shared from "./RhythmTraining.module.css";
import styles from "./PolyrhythmTraining.module.css";

const lanes = [
  { id: "high", name: "高い音" },
  { id: "low", name: "低い音" },
] as const;

export function PolyrhythmTraining({ isActive }: { isActive: boolean }) {
  const player = usePolyrhythmTraining(isActive);
  const pulses = getPolyrhythmPulses(player.ratio);

  return (
    <section className={shared.training} aria-labelledby="polyrhythm-title">
      <header className={shared.header}>
        <div>
          <h2 id="polyrhythm-title">ポリリズム</h2>
          <p className={styles.description}>2拍の中に違う数の打点を重ねます。次に音がそろうのは3拍目の頭です。</p>
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.controls}>
          <fieldset className={styles.ratios} disabled={player.isRunning}>
            <legend>リズムの組み合わせ</legend>
            <div>
              {polyrhythmRatios.map((ratio) => (
                <button
                  key={ratio.label}
                  type="button"
                  aria-pressed={player.ratio === ratio}
                  onClick={() => player.changeRatio(ratio)}
                >
                  {ratio.low.name} × {ratio.high.name}
                </button>
              ))}
            </div>
          </fieldset>
          <TrainingDial label="テンポ（四分音符）" unit="BPM" value={player.bpm} min={40} max={240} onChange={player.changeBpm} />
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
            {lanes.map(({ id, name }) => (
              <div className={styles.laneLabel} data-lane={id} key={id}>
                <div>
                  <strong>{player.ratio[id].name}</strong>
                  <span>{name}</span>
                </div>
                <button
                  type="button"
                  aria-label={`${player.ratio[id].name}の再生`}
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
            <div className={styles.trackCaption}>
              <span>1拍目</span><span>2拍目</span><span>次の頭</span>
            </div>
            <div className={styles.lines}>
              {lanes.map(({ id }) => (
                <div className={styles.lane} data-lane={id} data-muted={!player.audible[id]} key={id}>
                  {getPolyrhythmRests(player.ratio[id]).map((progress) => (
                    <span
                      key={progress}
                      className={styles.rest}
                      style={{ left: `${progress * 100}%` }}
                    />
                  ))}
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
        <p className={styles.description}>番号付きの丸が鳴る「タ」、小さい点は休む「ト」です。</p>
        {player.error && <p className={styles.error} role="alert">{player.error}</p>}
      </div>
    </section>
  );
}
