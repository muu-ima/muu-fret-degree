export const rhythmTrainingPatterns = [
  { label: "5連符", pulses: 5 },
  { label: "16分音符", pulses: 4 },
  { label: "三連符", pulses: 3 },
  { label: "8分音符", pulses: 2 },
] as const;

export type RhythmTrainingPulse = typeof rhythmTrainingPatterns[number]["pulses"];

export function getRhythmTrainingBeat(
  absoluteBeat: number,
  selectedPulses: readonly RhythmTrainingPulse[] = rhythmTrainingPatterns.map((pattern) => pattern.pulses),
) {
  const selectedIndices = rhythmTrainingPatterns.flatMap((pattern, index) =>
    selectedPulses.includes(pattern.pulses) ? [index] : [],
  );
  if (selectedIndices.length === 0) throw new Error("Select at least one training rhythm.");
  const beatInLoop = absoluteBeat % (selectedIndices.length * 8);
  const patternIndex = selectedIndices[Math.floor(beatInLoop / 8)];
  return {
    patternIndex,
    pattern: rhythmTrainingPatterns[patternIndex],
    measure: Math.floor((beatInLoop % 8) / 4) + 1,
    beat: beatInLoop % 4 + 1,
  };
}
