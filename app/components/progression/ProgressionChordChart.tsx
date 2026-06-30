"use client";

import type { ChordType } from "../../lib/music";
import { formatChordSymbol } from "../../lib/chord-symbol";
import {
  getProgressionBeatDuration,
  getProgressionBeatEventType,
  getProgressionCellForBeat,
  getProgressionRhythmEventAtStep,
  getProgressionTickRhythmEvents,
  getProgressionSustainingEventAtStep,
  progressionStepsPerBeat,
  progressionTicksPerBeat,
  type ProgressionHarmonyTarget,
  type ProgressionBar,
} from "../../lib/progression";

type ProgressionSelectionUnit = "beat" | "cell" | "bar";
type ProgressionSelectionRange = {
  unit: ProgressionSelectionUnit;
  startSlot: number;
  endSlot: number;
};

type ProgressionChordChartProps = {
  bars: readonly ProgressionBar[];
  chordTypes: ChordType[];
  lockedTargets: readonly ProgressionHarmonyTarget[];
  onBeatPointerDown: (barIndex: number, beatIndex: number) => void;
  onBeatPointerEnter: (barIndex: number, beatIndex: number) => void;
  selectionRange: ProgressionSelectionRange;
  selectionUnit: ProgressionSelectionUnit;
  selectedBarIndex: number;
  selectedBeatIndex: number;
  selectedStepInBeat: number;
  onBeatSelect: (barIndex: number, beatIndex: number, extendSelection?: boolean) => void;
};

export function ProgressionChordChart({
  bars,
  chordTypes,
  lockedTargets,
  onBeatPointerDown,
  onBeatPointerEnter,
  selectionRange,
  selectionUnit,
  selectedBarIndex,
  selectedBeatIndex,
  selectedStepInBeat,
  onBeatSelect,
}: ProgressionChordChartProps) {
  const isBeatInSelectionRange = (barIndex: number, beatIndex: number) => {
    const slotIndex = selectionUnit === "bar"
      ? barIndex
      : selectionUnit === "cell"
        ? barIndex * 2 + Math.floor(beatIndex / 2)
        : barIndex * 4 + beatIndex;

    return (
      selectionRange.unit === selectionUnit &&
      slotIndex >= selectionRange.startSlot &&
      slotIndex <= selectionRange.endSlot
    );
  };

  const isBeatLocked = (barIndex: number, beatIndex: number) =>
    lockedTargets.some((target) =>
      target.type === "beat"
        ? target.barIndex === barIndex && target.beatIndex === beatIndex
        : target.barIndex === barIndex && Math.floor(beatIndex / 2) === target.cellIndex
    );

  return (
    <section className="progressionChordChart" aria-label="コード進行譜">
      <div className="progressionChordChartHeader">
        <span>Chord Chart</span>
        <strong>
          Bar {bars[selectedBarIndex]?.bar ?? 1} · Beat {selectedBeatIndex + 1}
        </strong>
      </div>
      <div className="progressionChordChartGrid">
        {bars.map((bar, barIndex) => {
          const tickRhythmEvents = getProgressionTickRhythmEvents(bar);
          const beatSymbols = [0, 1, 2, 3].map((beatIndex) => {
            const cell = getProgressionCellForBeat(bar, beatIndex);
            return formatChordSymbol(cell.root, cell.chordTypeId, chordTypes);
          });

          return (
            <article
              className={`${barIndex === selectedBarIndex ? "progressionChartBar selected" : "progressionChartBar"}${
                selectionUnit === "bar" && isBeatInSelectionRange(barIndex, 0) ? " rangeSelected" : ""
              }`}
              key={bar.bar}
            >
              <span className="progressionChartBarNumber">Bar {bar.bar}</span>
              <div className="progressionChartChords">
                {beatSymbols.map((symbol, beatIndex) => (
                  <strong className="progressionChartChord" key={beatIndex}>
                    {beatIndex === 0 || symbol !== beatSymbols[beatIndex - 1] ? symbol : ""}
                  </strong>
                ))}
              </div>
              <div className="progressionChartBeats">
                {[0, 1, 2, 3].map((beatIndex) => {
                  const isSelected = barIndex === selectedBarIndex && beatIndex === selectedBeatIndex;
                  const isRangeSelected = isBeatInSelectionRange(barIndex, beatIndex);
                  const isLocked = isBeatLocked(barIndex, beatIndex);
                  const cell = getProgressionCellForBeat(bar, beatIndex);
                  const eventType = getProgressionBeatEventType(bar, beatIndex);
                  const durationSteps = getProgressionBeatDuration(bar, beatIndex);
                  const beatStartTick = beatIndex * progressionTicksPerBeat;
                  const beatTickEvents = tickRhythmEvents.filter(
                    (event) =>
                      event.startTick >= beatStartTick &&
                      event.startTick < beatStartTick + progressionTicksPerBeat,
                  );
                  const hasTripletPulse = beatTickEvents.some(
                    (event) =>
                      event.startTick % 3 !== 0 ||
                      event.durationTicks % 3 !== 0,
                  );
                  const durationLabel =
                    durationSteps === 1
                      ? "16"
                      : durationSteps === 2
                        ? "8"
                        : durationSteps === 3
                          ? "8·"
                          : durationSteps === 6
                            ? "4·"
                            : "4";
                  return (
                    <button
                      key={beatIndex}
                      type="button"
                      className={`progressionChartBeat${eventType === "rest" ? " rest" : ""}${eventType === "tie" ? " tie" : ""}${hasTripletPulse ? " triplet" : ""}${isRangeSelected ? " rangeSelected" : ""}${isLocked ? " locked" : ""}${isSelected ? " selected" : ""}`}
                      aria-label={`Bar ${bar.bar}, Beat ${beatIndex + 1}, ${formatChordSymbol(cell.root, cell.chordTypeId, chordTypes)}, ${eventType === "rest" ? "Rest" : eventType === "tie" ? "Tie" : `Hit, ${durationLabel}`}`}
                      aria-pressed={isSelected || isRangeSelected}
                      onPointerDown={(event) => {
                        if (event.pointerType === "mouse" || event.pointerType === "pen") {
                          onBeatPointerDown(barIndex, beatIndex);
                        }
                      }}
                      onPointerEnter={() => onBeatPointerEnter(barIndex, beatIndex)}
                      onClick={(event) => onBeatSelect(barIndex, beatIndex, event.shiftKey)}
                    >
                      <span className="progressionChartSlash" aria-hidden="true">
                        {eventType === "rest" ? "—" : eventType === "tie" ? "⌒" : "/"}
                      </span>
                      {hasTripletPulse ? (
                        <span className="progressionChartTripletLabel" aria-hidden="true">
                          3連
                        </span>
                      ) : null}
                      {eventType === "hit" ? (
                        <span className="progressionChartDuration" aria-hidden="true">
                          {durationLabel}
                        </span>
                      ) : null}
                      {hasTripletPulse ? (
                        <span className="progressionChartPulseLane" aria-hidden="true">
                          {[0, 1, 2].map((pulseIndex) => {
                            const pulseTick = beatStartTick + pulseIndex * 4;
                            const pulseEvent = beatTickEvents.find((event) => event.startTick === pulseTick);
                            return (
                              <span
                                key={pulseIndex}
                                className={`progressionChartPulse${pulseEvent ? ` ${pulseEvent.eventType}` : " empty"}`}
                              >
                                {pulseEvent
                                  ? pulseEvent.eventType === "hit"
                                    ? "●"
                                    : pulseEvent.eventType === "rest"
                                      ? "○"
                                      : "◌"
                                  : "·"}
                              </span>
                            );
                          })}
                        </span>
                      ) : null}
                      <span className="progressionChartStepLane" aria-hidden="true">
                        {[0, 1, 2, 3].map((stepInBeat) => {
                          const startStep = beatIndex * progressionStepsPerBeat + stepInBeat;
                          const stepEvent = getProgressionRhythmEventAtStep(bar, startStep);
                          const sustainingEvent = stepEvent
                            ? undefined
                            : getProgressionSustainingEventAtStep(bar, startStep);
                          const isStepSelected = isSelected && selectedStepInBeat === stepInBeat;
                          return (
                            <span
                              key={stepInBeat}
                              className={`progressionChartStep${stepEvent ? ` ${stepEvent.eventType}` : sustainingEvent ? " held" : " empty"}${isStepSelected ? " selected" : ""}`}
                            >
                              {stepEvent
                                ? stepEvent.eventType === "hit"
                                  ? "/"
                                  : stepEvent.eventType === "rest"
                                    ? "—"
                                    : "⌒"
                                : sustainingEvent
                                  ? "━"
                                  : "·"}
                            </span>
                          );
                        })}
                      </span>
                      <span className="progressionChartBeatNumber" aria-hidden="true">
                        {beatIndex + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
