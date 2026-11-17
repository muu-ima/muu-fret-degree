"use client";

import { useEffect, useRef, useState } from "react";
import { LuPlay, LuSquare } from "react-icons/lu";
import { playMetronomeClick } from "../../lib/audio";
import { getMetronomeClickKind } from "../../lib/metronome-click";
import { getRhythmTrainingBeat, rhythmTrainingPatterns } from "../../lib/rhythm-training";

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
    setPosition(getRhythmTrainingBeat(0));
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
          const current = getRhythmTrainingBeat(absoluteBeat);
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
        <p>4/4拍子・各2小節。5連符 → 16分音符 → 三連符 → 8分音符を繰り返します。</p>
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
      <label className="toggle">
        <input type="checkbox" checked={accentEnabled}
          onChange={(event) => {
            accentEnabledRef.current = event.target.checked;
            setAccentEnabled(event.target.checked);
          }} />
        拍の頭にアクセントを付ける（オフですべての音が均等）
      </label>
      <ol className="rhythmTrainingPatterns" aria-label="再生順">
        {rhythmTrainingPatterns.map((pattern, index) => (
          <li key={pattern.pulses} className={isRunning && position.patternIndex === index ? "active" : undefined}
            aria-current={isRunning && position.patternIndex === index ? "step" : undefined}>
            <strong>{pattern.label}</strong>
            <span>1拍に{pattern.pulses}音 · 2小節</span>
          </li>
        ))}
      </ol>
      <div className="rhythmTrainingPosition">
        <strong>{isRunning ? `${position.pattern.label} · ${position.measure} / 2 小節 · ${position.beat}拍目` : "5連符からスタート"}</strong>
        <div className="beatIndicator" aria-hidden="true">
          {[1, 2, 3, 4].map((beat) => <span key={beat} className={isRunning && position.beat === beat ? "active" : undefined} />)}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
