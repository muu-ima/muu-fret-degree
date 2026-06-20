"use client";

import { useCallback, useMemo } from "react";
import {
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPosition,
} from "../lib/progression/model";
import type { ProgressionRhythm } from "../lib/progression/playback";
import { getProgressionStepPlaybackRequest } from "../lib/progression/scheduler";
import { createProgressionVirtualTimeline } from "../lib/progression/rhythm/timeline";
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
  const timeline = useMemo(
    () => createProgressionVirtualTimeline(progression),
    [progression],
  );

  const scheduleBeat = useCallback((stepPosition: ProgressionPosition) => {
    if (bars.length === 0) {
      return;
    }

    const request = getProgressionStepPlaybackRequest(progression, stepPosition, timeline);
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
  }, [bars, playBeat, progression, rhythm, timeline]);

  useProgressionStepScheduler({
    isRunning,
    onStep: scheduleBeat,
    position,
  });
}
