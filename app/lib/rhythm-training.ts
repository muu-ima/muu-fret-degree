export const rhythmTrainingPatterns = [
  { label: "5連符", pulses: 5 },
  { label: "16分音符", pulses: 4 },
  { label: "三連符", pulses: 3 },
  { label: "8分音符", pulses: 2 },
] as const;

export function getRhythmTrainingBeat(absoluteBeat: number) {
  const beatInLoop = absoluteBeat % 32;
  const patternIndex = Math.floor(beatInLoop / 8);
  return {
    patternIndex,
    pattern: rhythmTrainingPatterns[patternIndex],
    measure: Math.floor((beatInLoop % 8) / 4) + 1,
    beat: beatInLoop % 4 + 1,
  };
}
