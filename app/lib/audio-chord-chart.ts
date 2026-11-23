import type { ChordSegment } from "@audio/mir-chordino";

export type AudioChartGrid = { bpm: number; beatsPerBar: number; firstBarStart: number };

type AudioChartBar = {
  number: number;
  start: number;
  partial: boolean;
  chords: { segment: ChordSegment; start: number }[];
};

export function formatAudioTime(seconds: number) {
  const centiseconds = Math.floor(seconds * 100 + 1e-9);
  const minutes = Math.floor(centiseconds / 6000);
  const wholeSeconds = String(Math.floor(centiseconds / 100) % 60).padStart(2, "0");
  const fraction = String(centiseconds % 100).padStart(2, "0");
  return `${minutes}:${wholeSeconds}.${fraction}`;
}

export function buildAudioChordChart(
  segments: readonly ChordSegment[],
  duration: number,
  { bpm, beatsPerBar, firstBarStart }: AudioChartGrid,
) {
  const barDuration = 60 * beatsPerBar / bpm;
  const epsilon = 1e-9;
  const bars: AudioChartBar[] = [];

  function alignToBar(time: number) {
    if (time >= duration - epsilon) return duration;
    const barIndex = Math.round((time - firstBarStart) / barDuration);
    const boundary = firstBarStart + barIndex * barDuration;
    // Chordino changes are frame-based. Align near-boundary changes in the chart only.
    return barIndex >= 0 && boundary <= duration && Math.abs(time - boundary) <= 0.065 ? boundary : time;
  }

  // Chordino emits consecutive segments. Keep a sustained chord in each bar it spans.
  let segmentIndex = 0;
  function makeBar(number: number, start: number, end: number): AudioChartBar {
    const chords: AudioChartBar["chords"] = [];
    for (; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      const segmentStart = alignToBar(segment.time);
      if (segmentStart >= end - epsilon) break;
      const segmentEnd = alignToBar(segment.time + segment.duration);
      if (segmentEnd > Math.max(start, segmentStart) + epsilon) {
        chords.push({ segment, start: Math.max(start, segmentStart) });
      }
      if (segmentEnd > end + epsilon) break;
    }
    return { number, start, partial: end - start < barDuration - epsilon, chords };
  }

  if (firstBarStart > 0) bars.push(makeBar(0, 0, firstBarStart));
  const count = Math.ceil((duration - firstBarStart) / barDuration - epsilon);
  for (let index = 0; index < count; index++) {
    const start = firstBarStart + index * barDuration;
    const end = Math.min(duration, firstBarStart + (index + 1) * barDuration);
    bars.push(makeBar(index + 1, start, end));
  }

  return { bars, count };
}
