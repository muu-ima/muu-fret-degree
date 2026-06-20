"use client";

import { useCallback } from "react";
import {
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPosition,
} from "../lib/progression";
import type { ProgressionRhythm } from "../lib/progression-playback";
import { getProgressionStepPlaybackRequest } from "../lib/progression-scheduler";
import { useProgressionStepScheduler } from "./useProgressionStepScheduler";

type UseProgressionBeatSchedulerOptions = {
  isRunning: boolean;
  playBeat: (options: {
    beatInBar: number;
    beatEventType?: ProgressionBeatEventType;
    durationSteps?: ProgressionDurationSteps;
    followingTieBeats?: number;
    rhythm: ProgressionRhythm;
    nextRoot?: string;
  }) => void;
  position: ProgressionPosition;
  progression: ChordProgression;
  rhythm: ProgressionRhythm;
};

export function useProgressionBeatScheduler({
  isRunning,
  playBeat,
  position,
  progression,
  rhythm,
}: UseProgressionBeatSchedulerOptions) {
  const bars = progression.bars;

  const scheduleBeat = useCallback((stepPosition: ProgressionPosition) => {
    if (bars.length === 0) {
      return;
    }

    const request = getProgressionStepPlaybackRequest(progression, stepPosition);
    if (!request) {
      return;
    }

    playBeat({
      beatInBar: request.beatInBar,
      beatEventType: request.beatEventType,
      durationSteps: request.durationSteps,
      followingTieBeats: request.followingTieBeats,
      rhythm,
      nextRoot: request.nextRoot,
    });
  }, [bars, playBeat, progression, rhythm]);

  useProgressionStepScheduler({
    isRunning,
    onStep: scheduleBeat,
    position,
  });
}
