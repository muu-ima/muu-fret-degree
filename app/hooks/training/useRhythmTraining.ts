"use client";

import { useEffect, useRef, useState } from "react";
import { playMetronomeClick } from "../../lib/audio";
import { getMetronomeClickKind } from "../../lib/metronome-click";
import {
  getRhythmTrainingBeat,
  normalizeRhythmTrainingMeasures,
  rhythmTrainingPatterns,
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

export function useRhythmTraining(isActive = true) {
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

  // Keep practice settings when switching tabs, but never play in a hidden panel.
  useEffect(() => {
    if (isActive) return;
    if (sessionRef.current) dispose(sessionRef.current);
    sessionRef.current = null;
    setIsRunning(false);
  }, [isActive]);

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
    if (!isActive || sessionRef.current) return;
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

  function changeMeasures(measures: RhythmTrainingMeasures) {
    if (!sessionRef.current) setMeasuresPerPattern(normalizeRhythmTrainingMeasures(measures, measuresPerPattern));
  }

  function changeAccent(enabled: boolean) {
    accentEnabledRef.current = enabled;
    setAccentEnabled(enabled);
  }

  return {
    bpm, commitBpm,
    accentEnabled, changeAccent,
    selectedPulses, selectedPatterns, togglePattern,
    measuresPerPattern, changeMeasures,
    isRunning, position, error, start, stop,
  };
}

export type RhythmTrainingController = ReturnType<typeof useRhythmTraining>;
