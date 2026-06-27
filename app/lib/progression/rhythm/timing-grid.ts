export type ProgressionTimingGrid = "sixteenth" | "triplet";

export const progressionTicksPerBeat = 12;

const progressionTimingGridUnitsPerBeat = {
  sixteenth: 4,
  triplet: 3,
} satisfies Record<ProgressionTimingGrid, number>;

export function getProgressionTimingGridUnitsPerBeat(grid: ProgressionTimingGrid) {
  return progressionTimingGridUnitsPerBeat[grid];
}

export function getProgressionTimingTicks(grid: ProgressionTimingGrid, units: number) {
  if (!Number.isInteger(units) || units < 0) {
    return undefined;
  }

  return units * (progressionTicksPerBeat / getProgressionTimingGridUnitsPerBeat(grid));
}

export function getProgressionTimingBeats(grid: ProgressionTimingGrid, units: number) {
  const ticks = getProgressionTimingTicks(grid, units);
  return ticks === undefined ? undefined : ticks / progressionTicksPerBeat;
}

export function getProgressionSixteenthStepFromTicks(ticks: number) {
  const ticksPerSixteenthStep = progressionTicksPerBeat / 4;
  if (!Number.isInteger(ticks) || ticks < 0 || ticks % ticksPerSixteenthStep !== 0) {
    return undefined;
  }

  return ticks / ticksPerSixteenthStep;
}
