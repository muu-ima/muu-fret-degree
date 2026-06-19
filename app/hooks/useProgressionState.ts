"use client";

import { useCallback, useEffect, useReducer, type Dispatch, type SetStateAction } from "react";
import type { ChordType } from "../lib/music";
import {
  createDefaultProgression,
  makeProgressionBeats,
  resizeProgressionBars,
  type ChordProgression,
  type ProgressionCell,
} from "../lib/progression";
import { usePersistedProgression } from "./usePersistedProgression";

type UseProgressionStateOptions = {
  bpm?: number;
  roots: string[];
  chordTypes: ChordType[];
};

type ProgressionHistory = {
  past: ChordProgression[];
  present: ChordProgression;
  future: ChordProgression[];
};

type ProgressionHistoryAction =
  | { type: "commit"; update: (current: ChordProgression) => ChordProgression }
  | { type: "hydrate"; update: SetStateAction<ChordProgression> }
  | { type: "sync-bpm"; bpm: number }
  | { type: "undo" }
  | { type: "redo" };

const historyLimit = 100;

function progressionHistoryReducer(
  state: ProgressionHistory,
  action: ProgressionHistoryAction,
): ProgressionHistory {
  if (action.type === "commit") {
    const nextProgression = action.update(state.present);
    if (nextProgression === state.present) {
      return state;
    }

    return {
      past: [...state.past, state.present].slice(-historyLimit),
      present: nextProgression,
      future: [],
    };
  }

  if (action.type === "hydrate") {
    const nextProgression =
      typeof action.update === "function" ? action.update(state.present) : action.update;
    return {
      past: [],
      present: nextProgression,
      future: [],
    };
  }

  if (action.type === "sync-bpm") {
    if (state.present.bpm === action.bpm) {
      return state;
    }

    return {
      ...state,
      present: { ...state.present, bpm: action.bpm },
    };
  }

  if (action.type === "undo") {
    const previous = state.past.at(-1);
    if (!previous) {
      return state;
    }

    return {
      past: state.past.slice(0, -1),
      present: { ...previous, bpm: state.present.bpm },
      future: [state.present, ...state.future].slice(0, historyLimit),
    };
  }

  const next = state.future[0];
  if (!next) {
    return state;
  }

  return {
    past: [...state.past, state.present].slice(-historyLimit),
    present: { ...next, bpm: state.present.bpm },
    future: state.future.slice(1),
  };
}

export function useProgressionState({ bpm = 120, roots, chordTypes }: UseProgressionStateOptions) {
  const [history, dispatch] = useReducer(progressionHistoryReducer, undefined, () => ({
    past: [],
    present: createDefaultProgression(bpm),
    future: [],
  }));
  const progression = history.present;

  const hydrateProgression: Dispatch<SetStateAction<ChordProgression>> = useCallback((update) => {
    dispatch({ type: "hydrate", update });
  }, []);

  useEffect(() => {
    dispatch({ type: "sync-bpm", bpm });
  }, [bpm]);

  usePersistedProgression({
    progression,
    setProgression: hydrateProgression,
    roots,
    chordTypes,
  });

  const updateCell = useCallback((barIndex: number, cellIndex: number, nextCell: ProgressionCell) => {
    dispatch({
      type: "commit",
      update: (currentProgression) => {
        const currentCell = currentProgression.bars[barIndex]?.cells[cellIndex];
        if (
          currentCell &&
          currentCell.root === nextCell.root &&
          currentCell.chordTypeId === nextCell.chordTypeId
        ) {
          return currentProgression;
        }

        return {
          ...currentProgression,
          bars: currentProgression.bars.map((bar, index) => {
            if (index !== barIndex) {
              return bar;
            }

            return {
              ...bar,
              cells: [
                cellIndex === 0 ? nextCell : bar.cells[0],
                cellIndex === 1 ? nextCell : bar.cells[1],
              ] as const,
            };
          }),
        };
      },
    });
  }, []);

  const updateBarCount = useCallback((nextBarCount: number) => {
    dispatch({
      type: "commit",
      update: (currentProgression) =>
        currentProgression.bars.length === nextBarCount
          ? currentProgression
          : {
              ...currentProgression,
              bars: resizeProgressionBars(currentProgression.bars, nextBarCount),
            },
    });
  }, []);

  const updateBeatChord = useCallback(
    (barIndex: number, beatIndex: number, nextCell: ProgressionCell | undefined) => {
      dispatch({
        type: "commit",
        update: (currentProgression) => {
          const currentBar = currentProgression.bars[barIndex];
          if (!currentBar || beatIndex < 0 || beatIndex > 3) {
            return currentProgression;
          }

          const currentOverride = currentBar.beats?.[beatIndex]?.chordOverride;
          const hasSameOverride =
            currentOverride?.root === nextCell?.root &&
            currentOverride?.chordTypeId === nextCell?.chordTypeId;
          if ((currentOverride === undefined && nextCell === undefined) || hasSameOverride) {
            return currentProgression;
          }

          const nextBeats = makeProgressionBeats(currentBar);
          nextBeats[beatIndex] = nextCell ? { chordOverride: { ...nextCell } } : {};
          const hasOverrides = nextBeats.some((beat) => beat.chordOverride !== undefined);

          return {
            ...currentProgression,
            bars: currentProgression.bars.map((bar, index) => {
              if (index !== barIndex) {
                return bar;
              }

              if (hasOverrides) {
                return { ...bar, beats: nextBeats };
              }

              const { beats: _beats, ...barWithoutBeats } = bar;
              return barWithoutBeats;
            }),
          };
        },
      });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    progression,
    redo,
    undo,
    updateBarCount,
    updateBeatChord,
    updateCell,
  };
}
