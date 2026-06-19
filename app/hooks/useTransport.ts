"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTransport() {
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const stop = useCallback(() => {
    setIsRunning(false);
    startTimeRef.current = null;
    if (animationFrameId.current !== null) {
      window.cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsedSeconds(0);
  }, [stop]);

  const start = useCallback(() => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    startTimeRef.current = window.performance.now() / 1000 - elapsedSeconds;
  }, [elapsedSeconds, isRunning]);

  useEffect(() => {
    if (!isRunning) {
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
  }, [isRunning]);

  return {
    elapsedSeconds,
    isRunning,
    reset,
    start,
    stop,
  };
}
