// Coordinates are relative to the dial centre, normalized by its radius.
export function getTrainingDialTapValue(x: number, y: number, min: number, max: number): number | null {
  const radius = Math.hypot(x, y);
  if (!Number.isFinite(radius) || radius < 0.2 || radius > 1) return null;
  const angle = Math.atan2(x, -y) * 180 / Math.PI;
  // The bottom gap is outside the dial's 270-degree scale.
  if (angle < -135 || angle > 135) return null;
  return Math.min(max, Math.max(min, Math.round(min + (angle + 135) / 270 * (max - min))));
}
