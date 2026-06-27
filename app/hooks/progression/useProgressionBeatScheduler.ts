"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
import {
  getProgressionStepPlaybackRequest,
  getProgressionTickPlaybackRequest,
} from "../../lib/progression/playback/scheduler";
import { hasProgressionNonStepTickRhythmAtBeat } from "../../lib/progression/rhythm/queries";
import { createProgressionVirtualTimeline } from "../../lib/progression/rhythm/timeline";
import { getProgressionTickIndex } from "../../lib/progression/rhythm/ticks";
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
  const currentBar = bars.length > 0
    ? bars[position.barIndex % bars.length]
    : undefined;
  const useTickRhythmPlayback = currentBar
    ? hasProgressionNonStepTickRhythmAtBeat(currentBar, position.beatInBar)
    : false;
  const currentTickIndex = useMemo(
    () =>
      getProgressionTickIndex(
        position.elapsedSeconds,
        progression.bpm,
        progression.timeSignature.beatUnit,
      ),
    [position.elapsedSeconds, progression.bpm, progression.timeSignature.beatUnit],
  );
  const lastTickRef = useRef<number | null>(null);

  const scheduleBeat = useCallback((stepPosition: ProgressionPosition) => {
    if (bars.length === 0) {
      return;
    }

    const currentStepBar = bars[stepPosition.barIndex % bars.length];
    if (!currentStepBar) {
      return;
    }

    if (hasProgressionNonStepTickRhythmAtBeat(currentStepBar, stepPosition.beatInBar)) {
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
    enabled: !useTickRhythmPlayback,
    isRunning,
    onStep: scheduleBeat,
    position,
  });

  useEffect(() => {
    if (!isRunning || !useTickRhythmPlayback) {
      lastTickRef.current = null;
      return;
    }

    if (lastTickRef.current === currentTickIndex) {
      return;
    }

    lastTickRef.current = currentTickIndex;
    const request = getProgressionTickPlaybackRequest(progression, currentTickIndex);
    if (!request) {
      return;
    }

    playBeat({
      beatInBar: request.beatInBar,
      beatEventType: request.beatEventType,
      durationSeconds: request.durationSeconds,
      durationSteps: request.durationSteps,
      followingTieBeats: request.followingTieBeats,
      rhythm,
      startDelay: 0,
      nextRoot: request.nextRoot,
    });
  }, [
    currentTickIndex,
    isRunning,
    playBeat,
    progression,
    rhythm,
    timeline,
    useTickRhythmPlayback,
  ]);
}
