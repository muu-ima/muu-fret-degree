"use client";

import { useCallback, useMemo } from "react";
import {
  type ChordProgression,
  type ProgressionBeatEventType,
  type ProgressionDurationSteps,
  type ProgressionPosition,
} from "../../lib/progression/model";
import type { ProgressionRhythm } from "../../lib/progression/playback";
import {
  getProgressionGrooveDelaySeconds,
  getProgressionGrooveDurationSeconds,
  type ProgressionGroove,
} from "../../lib/progression/groove";
import { getProgressionStepPlaybackRequest } from "../../lib/progression/playback/scheduler";
import { createProgressionVirtualTimeline } from "../../lib/progression/rhythm/timeline";
import { useProgressionStepScheduler } from "./useProgressionStepScheduler";

type UseProgressionBeatSchedulerOptions = {
  isRunning: boolean;
  playBeat: (options: {
    beatInBar: number;
    beatEventType?: ProgressionBeatEventType;
    durationSeconds?: number;
    durationSteps?: ProgressionDurationSteps;
    followingTieBeats?: number;
    rhythm: ProgressionRhythm;
    startDelay?: number;
    nextRoot?: string;
  }) => void;
  position: ProgressionPosition;
  progression: ChordProgression;
  groove?: ProgressionGroove;
  rhythm: ProgressionRhythm;
};

export function useProgressionBeatScheduler({
  isRunning,
  playBeat,
  position,
  progression,
  groove = "straight",
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
      durationSeconds: getProgressionGrooveDurationSeconds(
        request.stepInBeat,
        request.durationSteps,
        progression.bpm,
        groove,
      ),
      durationSteps: request.durationSteps,
      followingTieBeats: request.followingTieBeats,
      rhythm,
      startDelay: getProgressionGrooveDelaySeconds(
        request.stepInBeat,
        progression.bpm,
        groove,
      ),
      nextRoot: request.nextRoot,
    });
  }, [bars, groove, playBeat, progression, rhythm, timeline]);

  useProgressionStepScheduler({
    isRunning,
    onStep: scheduleBeat,
    position,
  });
}
