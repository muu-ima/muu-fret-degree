"use client";

import { useEffect, useRef } from "react";
import type { ProgressionPosition } from "../../lib/progression";

type UseProgressionStepSchedulerOptions = {
  isRunning: boolean;
  onStep: (position: ProgressionPosition) => void;
  position: ProgressionPosition;
};

export function useProgressionStepScheduler({
  isRunning,
  onStep,
  position,
}: UseProgressionStepSchedulerOptions) {
  const lastStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      lastStepRef.current = null;
      return;
    }

    if (lastStepRef.current === position.stepIndex) {
      return;
    }

    lastStepRef.current = position.stepIndex;
    onStep(position);
  }, [isRunning, onStep, position.stepIndex]);
}
