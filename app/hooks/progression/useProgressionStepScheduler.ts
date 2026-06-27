"use client";

import { useEffect, useRef } from "react";
import type { ProgressionPosition } from "../../lib/progression";

type UseProgressionStepSchedulerOptions = {
  isRunning: boolean;
  enabled?: boolean;
  onStep: (position: ProgressionPosition) => void;
  position: ProgressionPosition;
};

export function useProgressionStepScheduler({
  enabled = true,
  isRunning,
  onStep,
  position,
}: UseProgressionStepSchedulerOptions) {
  const lastStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning || !enabled) {
      lastStepRef.current = null;
      return;
    }

    if (lastStepRef.current === position.stepIndex) {
      return;
    }

    lastStepRef.current = position.stepIndex;
    onStep(position);
  }, [enabled, isRunning, onStep, position.stepIndex]);
}
