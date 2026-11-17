"use client";

import { useEffect, useRef, useState } from "react";
import { LuPlay, LuSquare } from "react-icons/lu";
import { playMetronomeClick } from "../../lib/audio";
import { getMetronomeClickKind } from "../../lib/metronome-click";
import {
  getRhythmTrainingBeat,
  rhythmTrainingPatterns,
  rhythmTrainingMeasureOptions,
  type RhythmTrainingPulse,
  type RhythmTrainingMeasures,
} from "../../lib/rhythm-training";

type Position = ReturnType<typeof getRhythmTrainingBeat>;
type Session = {
  context: AudioContext;
  timer?: number;
  frame?: number;
};

function dispose(session: Session) {
  window.clearTimeout(session.timer);
  window.cancelAnimationFrame(session.frame ?? 0);
  if (session.context.state !== "closed") void session.context.close().catch(() => {});
}

export function RhythmTraining() {
  const [bpm, setBpm] = useState(80);
  const [bpmInput, setBpmInput] = useState("80");
  const bpmRef = useRef(bpm);
  const [accentEnabled, setAccentEnabled] = useState(true);
  const accentEnabledRef = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState<Position>(getRhythmTrainingBeat(0));
  const [error, setError] = useState("");
  const [measuresPerPattern, setMeasuresPerPattern] = useState<RhythmTrainingMeasures>(2);
  const [selectedPulses, setSelectedPulses] = useState<RhythmTrainingPulse[]>(
    () => rhythmTrainingPatterns.map((pattern) => pattern.pulses),
  );
  const selectedPatterns = rhythmTrainingPatterns.filter((pattern) => selectedPulses.includes(pattern.pulses));

  function togglePattern(pulses: RhythmTrainingPulse) {
    if (sessionRef.current) return;
    setSelectedPulses((current) => {
      if (!current.includes(pulses)) return [...current, pulses];
      return current.length > 1 ? current.filter((value) => value !== pulses) : current;
    });
  }

  useEffect(() => () => {
    if (sessionRef.current) dispose(sessionRef.current);
    sessionRef.current = null;
  }, []);

  function commitBpm(value: string) {
    const parsed = Number(value);
    const next = value.trim() && Number.isFinite(parsed)
      ? Math.min(240, Math.max(40, Math.round(parsed))) : bpm;
    bpmRef.current = next;
    setBpm(next);
    setBpmInput(String(next));
  }

  function stop() {
    if (sessionRef.current) dispose(sessionRef.current);
    sessionRef.current = null;
    setIsRunning(false);
    setPosition(getRhythmTrainingBeat(0, selectedPulses, measuresPerPattern));
  }

  async function start() {
    if (sessionRef.current) return;
    setError("");
    commitBpm(bpmInput);
    let session: Session | undefined;
    try {
      const context = new AudioContext();
      session = { context };
      sessionRef.current = session;
      setPosition(getRhythmTrainingBeat(0, selectedPulses, measuresPerPattern));
      setIsRunning(true);
      await context.resume();
      if (sessionRef.current !== session) return;

      let absoluteBeat = 0;
      let nextBeatTime = context.currentTime + 0.05;
      const positions: Array<{ time: number; position: Position }> = [];
      const activeSession = session;

      // Schedule against the audio clock so timer jitter does not change the rhythm.
      const schedule = () => {
        if (sessionRef.current !== activeSession) return;
        if (nextBeatTime < context.currentTime) nextBeatTime = context.currentTime + 0.05;
        while (nextBeatTime < context.currentTime + 0.1) {
          const current = getRhythmTrainingBeat(absoluteBeat, selectedPulses, measuresPerPattern);
          const beatDuration = 60 / bpmRef.current;
          for (let pulse = 0; pulse < current.pattern.pulses; pulse += 1) {
            playMetronomeClick(
              context,
              nextBeatTime + pulse * beatDuration / current.pattern.pulses,
              getMetronomeClickKind(accentEnabledRef.current, current.beat - 1, pulse),
              "wood",
              0.7,
            );
          }
          positions.push({ time: nextBeatTime, position: current });
          nextBeatTime += beatDuration;
          absoluteBeat += 1;
        }
        activeSession.timer = window.setTimeout(schedule, 25);
      };
      const draw = () => {
        if (sessionRef.current !== activeSession) return;
        let latest: Position | undefined;
        while (positions.length && positions[0].time <= context.currentTime) {
          latest = positions.shift()!.position;
        }
        if (latest) setPosition(latest);
        activeSession.frame = window.requestAnimationFrame(draw);
      };
      schedule();
      draw();
    } catch {
      if (session && sessionRef.current !== session) return;
      stop();
      setError("音声を開始できませんでした。もう一度再生してください。");
    }
  }

  return (
    <section className="rhythmTraining" aria-labelledby="rhythm-training-title">
      <div>
        <p className="panelEyebrow">Rhythm Training</p>
        <h2 id="rhythm-training-title">リズム聴き比べ</h2>
        <p>4/4拍子・各{measuresPerPattern}小節。{selectedPatterns.map((pattern) => pattern.label).join(" → ")}を繰り返します。</p>
      </div>
      <div className="rhythmTrainingControls">
        <label className="metronomeBpmInput">
          BPM（四分音符）
          <input type="number" min="40" max="240" step="1" value={bpmInput}
            onChange={(event) => setBpmInput(event.target.value)}
            onBlur={(event) => commitBpm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitBpm(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }} />
        </label>
        <button type="button" className={isRunning ? "actionButton active" : "actionButton"}
          onClick={() => isRunning ? stop() : void start()}>
          {isRunning ? <LuSquare aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
          {isRunning ? "停止" : "再生"}
        </button>
        <span>40–240 BPM · テンポ変更は次の拍から反映</span>
      </div>
      <fieldset className="rhythmTrainingSelection" aria-describedby="rhythm-measures-help">
        <legend>切り替え小節数</legend>
        <p id="rhythm-measures-help">各リズムを何小節ずつ再生するか選びます。変更は停止中にできます。</p>
        <div className="rhythmTrainingControls">
          {rhythmTrainingMeasureOptions.map((measures) => (
            <label className="toggle" key={measures}>
              <input type="radio" name="rhythm-training-measures" value={measures}
                checked={measuresPerPattern === measures} disabled={isRunning}
                onChange={() => {
                  if (!sessionRef.current) setMeasuresPerPattern(measures);
                }} />
              {measures}小節
            </label>
          ))}
        </div>
      </fieldset>
      <label className="toggle">
        <input type="checkbox" checked={accentEnabled}
          onChange={(event) => {
            accentEnabledRef.current = event.target.checked;
            setAccentEnabled(event.target.checked);
          }} />
        拍の頭にアクセントを付ける（オフですべての音が均等）
      </label>
      <fieldset className="rhythmTrainingSelection" aria-describedby="rhythm-selection-help">
        <legend>練習するリズム</legend>
        <p id="rhythm-selection-help">1種類なら単独ループ、複数なら表示順に再生します。最低1種類を選択してください。変更は停止中にできます。</p>
        <ol className="rhythmTrainingPatterns" aria-label="リズムの選択と再生順">
          {rhythmTrainingPatterns.map((pattern, index) => {
            const selected = selectedPulses.includes(pattern.pulses);
            const active = isRunning && position.patternIndex === index;
            return (
              <li key={pattern.pulses} className={active ? "active" : selected ? "selected" : undefined}
                aria-current={active ? "step" : undefined}>
                <label>
                  <input type="checkbox" checked={selected}
                    disabled={isRunning || (selected && selectedPulses.length === 1)}
                    onChange={() => togglePattern(pattern.pulses)} />
                  <strong>{pattern.label}</strong>
                  <span>1拍に{pattern.pulses}音 · {measuresPerPattern}小節</span>
                </label>
              </li>
            );
          })}
        </ol>
      </fieldset>
      <div className="rhythmTrainingPosition">
        <strong>{isRunning ? `${position.pattern.label} · ${position.measure} / ${measuresPerPattern} 小節 · ${position.beat}拍目` : `${selectedPatterns[0].label}からスタート`}</strong>
        <div className="beatIndicator" aria-hidden="true">
          {[1, 2, 3, 4].map((beat) => <span key={beat} className={isRunning && position.beat === beat ? "active" : undefined} />)}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
