"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MetronomeMix } from "../../lib/metronome-mixer";
import type { MetronomeTone } from "../../lib/audio";
import { createMetronomePlayback, metronomePollMs, type MetronomeAudioSession, type MetronomePosition } from "../../lib/metronome-playback";

type UseMetronomeOptions = {
  mix: MetronomeMix;
  bpm: number;
  beatsPerMeasure: number;
  countInMeasures: number;
  metronomeTone: MetronomeTone;
  metronomeVolume: number;
  createAudioSession: () => MetronomeAudioSession;
  onCountInComplete?: () => void;
};

type Run = { audio: MetronomeAudioSession; timer?: number; playback?: ReturnType<typeof createMetronomePlayback> };

export function useMetronome({
  mix, bpm, beatsPerMeasure, countInMeasures, metronomeTone, metronomeVolume,
  createAudioSession, onCountInComplete,
}: UseMetronomeOptions) {
  const runRef = useRef<Run | null>(null);
  const settingsRef = useRef({ bpm, mix, tone: metronomeTone, volume: metronomeVolume });
  const onCompleteRef = useRef(onCountInComplete);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<MetronomePosition>({ currentBeat: 1, isCountingIn: false, countInBeatsRemaining: 0 });

  useEffect(() => {
    settingsRef.current = { bpm, mix, tone: metronomeTone, volume: metronomeVolume };
    onCompleteRef.current = onCountInComplete;
  }, [bpm, mix, metronomeTone, metronomeVolume, onCountInComplete]);

  const disposeRun = useCallback(() => {
    const run = runRef.current;
    runRef.current = null;
    if (!run) return;
    window.clearTimeout(run.timer);
    if (run.playback) run.playback.stop();
    else run.audio.stop();
  }, []);

  const stopMetronome = useCallback(() => {
    disposeRun();
    setIsMetronomeRunning(false);
    setPosition({ currentBeat: 1, isCountingIn: false, countInBeatsRemaining: 0 });
  }, [disposeRun]);

  const startMetronome = useCallback(() => {
    disposeRun();
    setError("");
    setPosition({ currentBeat: 1, isCountingIn: countInMeasures > 0, countInBeatsRemaining: countInMeasures * beatsPerMeasure });
    let run: Run;
    try {
      // Resume in the user's event handler; the clock starts only once audio is ready.
      run = { audio: createAudioSession() };
      runRef.current = run;
      setIsMetronomeRunning(true);
    } catch {
      stopMetronome();
      setError("音声を開始できませんでした。もう一度再生してください。");
      return;
    }
    void run.audio.ready.then(() => {
      if (runRef.current !== run) return;
      run.playback = createMetronomePlayback({
        audio: run.audio, beatsPerMeasure, countInMeasures,
        settings: () => settingsRef.current,
        onPosition: setPosition,
        onCountInComplete: () => onCompleteRef.current?.(),
      });
      const poll = () => {
        if (runRef.current !== run) return;
        try {
          run.playback!.pump();
          if (runRef.current === run) run.timer = window.setTimeout(poll, metronomePollMs);
        } catch {
          stopMetronome();
          setError("音声を再生できませんでした。もう一度再生してください。");
        }
      };
      poll();
    }).catch(() => {
      if (runRef.current !== run) return;
      stopMetronome();
      setError("音声を開始できませんでした。もう一度再生してください。");
    });
  }, [beatsPerMeasure, countInMeasures, createAudioSession, disposeRun, stopMetronome]);

  // Structural settings restart the measure, as before; sound/BPM updates do not.
  useEffect(() => {
    if (runRef.current) startMetronome();
  }, [startMetronome]);
  useEffect(() => disposeRun, [disposeRun]);

  const toggleMetronome = useCallback(() => {
    if (runRef.current) stopMetronome();
    else startMetronome();
  }, [startMetronome, stopMetronome]);

  return { ...position, error, isMetronomeRunning, startMetronome, stopMetronome, toggleMetronome };
}
