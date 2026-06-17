"use client";

import { useCallback, useState } from "react";

const minBpm = 40;
const maxBpm = 240;
const initialBpm = 120;

function normalizeBpm(value: string, fallback: number) {
  const nextBpm = Number(value);
  if (!Number.isFinite(nextBpm)) {
    return fallback;
  }

  return Math.min(maxBpm, Math.max(minBpm, Math.round(nextBpm)));
}

export function useBpmControl() {
  const [bpm, setBpm] = useState(initialBpm);
  const [bpmInput, setBpmInput] = useState(String(initialBpm));

  const commitBpm = useCallback(
    (value: string) => {
      const normalizedBpm = normalizeBpm(value, bpm);
      setBpm(normalizedBpm);
      setBpmInput(String(normalizedBpm));
    },
    [bpm],
  );

  const updateBpm = useCallback((value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setBpmInput(value);
    const nextBpm = Number(value);
    if (Number.isFinite(nextBpm) && nextBpm >= minBpm && nextBpm <= maxBpm) {
      setBpm(Math.round(nextBpm));
    }
  }, []);

  return {
    bpm,
    bpmInput,
    commitBpm,
    updateBpm,
  };
}
