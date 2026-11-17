export const rhythmTrainingPatterns = [
  { label: "5連符", pulses: 5 },
  { label: "16分音符", pulses: 4 },
  { label: "三連符", pulses: 3 },
  { label: "8分音符", pulses: 2 },
] as const;

export const rhythmTrainingMeasureOptions = [1, 2, 4, 8] as const;
export type RhythmTrainingMeasures = typeof rhythmTrainingMeasureOptions[number];

export type RhythmTrainingPulse = typeof rhythmTrainingPatterns[number]["pulses"];

export function getRhythmTrainingBeat(
  absoluteBeat: number,
  selectedPulses: readonly RhythmTrainingPulse[] = rhythmTrainingPatterns.map((pattern) => pattern.pulses),
  measuresPerPattern: RhythmTrainingMeasures = 2,
) {
  const selectedIndices = rhythmTrainingPatterns.flatMap((pattern, index) =>
    selectedPulses.includes(pattern.pulses) ? [index] : [],
  );
  if (selectedIndices.length === 0) throw new Error("Select at least one training rhythm.");
  const beatsPerPattern = measuresPerPattern * 4;
  const beatInLoop = absoluteBeat % (selectedIndices.length * beatsPerPattern);
  const patternIndex = selectedIndices[Math.floor(beatInLoop / beatsPerPattern)];
  return {
    patternIndex,
    pattern: rhythmTrainingPatterns[patternIndex],
    measure: Math.floor((beatInLoop % beatsPerPattern) / 4) + 1,
    beat: beatInLoop % 4 + 1,
  };
}
