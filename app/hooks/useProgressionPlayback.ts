"use client";

import { useMemo } from "react";
import {
  getProgressionPlaybackState,
  type ChordProgression,
  type ProgressionBar,
  type ProgressionPosition,
  type ProgressionSelection,
} from "../lib/progression";
import { useTransport } from "./useTransport";

type UseProgressionPlaybackOptions = {
  progression: ChordProgression;
};

export function useProgressionPlayback({ progression }: UseProgressionPlaybackOptions) {
  const {
    elapsedSeconds,
    isRunning: isProgressionRunning,
    reset: resetProgression,
    start: startProgression,
    stop: stopProgression,
  } = useTransport();

  const progressionState = useMemo(
    () => getProgressionPlaybackState(progression, elapsedSeconds),
    [elapsedSeconds, progression],
  );
  const progressionPosition: ProgressionPosition = progressionState.position;
  const currentProgressionSelection: ProgressionSelection | undefined = progressionState.selection;
  const currentProgressionBar: ProgressionBar | undefined = currentProgressionSelection?.bar;

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
