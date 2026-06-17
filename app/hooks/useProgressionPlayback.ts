"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentProgressionBar,
  getCurrentProgressionSelection,
  getProgressionPosition,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionPosition,
  type ProgressionSelection,
} from "../lib/progression";

type UseProgressionPlaybackOptions = {
  progression: ChordProgression;
};

export function useProgressionPlayback({ progression }: UseProgressionPlaybackOptions) {
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isProgressionRunning, setIsProgressionRunning] = useState(false);

  const stopProgression = useCallback(() => {
    setIsProgressionRunning(false);
    startTimeRef.current = null;
    if (animationFrameId.current !== null) {
      window.cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const resetProgression = useCallback(() => {
    stopProgression();
    setElapsedSeconds(0);
  }, [stopProgression]);

  const startProgression = useCallback(() => {
    if (isProgressionRunning) {
      return;
    }

    setIsProgressionRunning(true);
    startTimeRef.current = window.performance.now() / 1000 - elapsedSeconds;
  }, [elapsedSeconds, isProgressionRunning]);

  useEffect(() => {
    if (!isProgressionRunning) {
      return;
    }

    const tick = () => {
      if (startTimeRef.current === null) {
        return;
      }

      const nextElapsedSeconds = window.performance.now() / 1000 - startTimeRef.current;
      setElapsedSeconds(Math.max(0, nextElapsedSeconds));
      animationFrameId.current = window.requestAnimationFrame(tick);
    };

    animationFrameId.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameId.current !== null) {
        window.cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isProgressionRunning]);

  const progressionPosition: ProgressionPosition = useMemo(
    () => getProgressionPosition(elapsedSeconds, progression.bpm, progression.timeSignature),
    [elapsedSeconds, progression],
  );

  const currentProgressionBar: ProgressionBar | undefined = useMemo(
    () => getCurrentProgressionBar(progression, elapsedSeconds),
    [elapsedSeconds, progression],
  );
  const currentProgressionSelection: ProgressionSelection | undefined = useMemo(
    () => getCurrentProgressionSelection(progression, elapsedSeconds),
    [elapsedSeconds, progression],
  );

  return {
    currentProgressionBar,
    currentProgressionSelection,
    elapsedSeconds,
    isProgressionRunning,
    progressionPosition,
    resetProgression,
    startProgression,
    stopProgression,
  };
}
