import type { ChordProgression } from "./progression";

export type ProgressionHistory = {
  past: ChordProgression[];
  present: ChordProgression;
  future: ChordProgression[];
};

export type ProgressionUpdate =
  | ChordProgression
  | ((current: ChordProgression) => ChordProgression);

export type ProgressionHistoryAction =
  | { type: "commit"; update: (current: ChordProgression) => ChordProgression }
  | { type: "hydrate"; update: ProgressionUpdate }
  | { type: "sync-bpm"; bpm: number }
  | { type: "undo" }
  | { type: "redo" };

const historyLimit = 100;

export function createProgressionHistory(progression: ChordProgression): ProgressionHistory {
  return {
    past: [],
    present: progression,
    future: [],
  };
}

export function progressionHistoryReducer(
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
