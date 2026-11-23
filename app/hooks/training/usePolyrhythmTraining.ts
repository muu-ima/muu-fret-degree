"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playMetronomeClick } from "../../lib/audio";
import { metronomeLookAheadSeconds, metronomePollMs } from "../../lib/metronome-playback";
import {
  createPolyrhythmPlayback, polyrhythmRatios, type PolyrhythmPulse, type PolyrhythmRatio,
} from "../../lib/polyrhythm";

type Lane = "high" | "low";
type Session = {
  context: AudioContext;
  outputs: Record<Lane, GainNode>;
  timer?: number;
  frame?: number;
};

function dispose(session: Session) {
  window.clearTimeout(session.timer);
  window.cancelAnimationFrame(session.frame ?? 0);
  Object.values(session.outputs).forEach((output) => output.disconnect());
  if (session.context.state !== "closed") void session.context.close().catch(() => {});
}

export function usePolyrhythmTraining(isActive: boolean) {
  const [ratio, setRatio] = useState<PolyrhythmRatio>(polyrhythmRatios[0]);
  const [bpm, setBpm] = useState(72);
  const [audible, setAudible] = useState<Record<Lane, boolean>>({ high: true, low: true });
  const [isRunning, setIsRunning] = useState(false);
  const [hit, setHit] = useState<PolyrhythmPulse | null>(null);
  const [error, setError] = useState("");
  const bpmRef = useRef(bpm);
  const sessionRef = useRef<Session | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const release = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) dispose(session);
  }, []);

  const stop = useCallback(() => {
    release();
    trackRef.current?.style.removeProperty("--playhead");
    setIsRunning(false);
    setHit(null);
  }, [release]);

  useEffect(() => release, [release]);
  useEffect(() => { if (!isActive) stop(); }, [isActive, stop]);

  function changeBpm(value: number) {
    bpmRef.current = value;
    setBpm(value);
  }

  function changeRatio(next: PolyrhythmRatio) {
    if (!sessionRef.current) setRatio(next);
  }

  function toggleLane(lane: Lane) {
    const enabled = !audible[lane];
    const session = sessionRef.current;
    if (session) session.outputs[lane].gain.setTargetAtTime(Number(enabled), session.context.currentTime, 0.005);
    setAudible({ ...audible, [lane]: enabled });
  }

  async function start() {
    if (!isActive || sessionRef.current) return;
    setError("");
    let session: Session | undefined;
    let context: AudioContext | undefined;
    try {
      const audio = new AudioContext();
      context = audio;
      const outputs = { high: audio.createGain(), low: audio.createGain() };
      const activeSession: Session = { context: audio, outputs };
      session = activeSession;
      sessionRef.current = session;
      for (const lane of ["high", "low"] as const) {
        outputs[lane].gain.value = Number(audible[lane]);
        outputs[lane].connect(audio.destination);
      }
      setIsRunning(true);
      await audio.resume();
      if (sessionRef.current !== session) return;

      const playback = createPolyrhythmPlayback({
        ratio,
        firstStart: audio.currentTime + 0.06,
        getBpm: () => bpmRef.current,
        play: (time, pulse) => {
          const kind = pulse.progress === 0 ? "accent" : "beat";
          if (pulse.high !== null) playMetronomeClick(audio, time, kind, "wood", 0.55, outputs.high);
          if (pulse.low !== null) playMetronomeClick(audio, time, kind, "soft", 0.85, outputs.low);
        },
      });
      const schedule = () => {
        playback.pump(audio.currentTime, metronomeLookAheadSeconds);
        activeSession.timer = window.setTimeout(schedule, metronomePollMs);
      };
      let lastHit: PolyrhythmPulse | null = null;
      const draw = () => {
        const { progress, hit: currentHit } = playback.getFrame(audio.currentTime);
        trackRef.current?.style.setProperty("--playhead", `${progress * 100}%`);
        if (lastHit !== currentHit) {
          lastHit = currentHit;
          setHit(currentHit);
        }
        activeSession.frame = window.requestAnimationFrame(draw);
      };
      schedule();
      draw();
    } catch {
      if (session && sessionRef.current !== session) return;
      if (!session && context) void context.close().catch(() => {});
      stop();
      setError("音声を開始できませんでした。もう一度再生してください。");
    }
  }

  return { ratio, changeRatio, bpm, changeBpm, audible, toggleLane, isRunning, start, stop, trackRef, hit, error };
}
