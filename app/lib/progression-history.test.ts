import { describe, expect, it } from "vitest";
import {
  createProgressionHistory,
  progressionHistoryReducer,
} from "./progression-history";
import { createDefaultProgression, updateProgressionCell } from "./progression";

describe("progression history", () => {
  it("undoes and redoes edits while preserving the current BPM", () => {
    const initial = createDefaultProgression(120);
    const editedCell = { root: "Eb", chordTypeId: "m7" };
    let history = createProgressionHistory(initial);

    history = progressionHistoryReducer(history, {
      type: "commit",
      update: (progression) => updateProgressionCell(progression, 0, 0, editedCell),
    });
    history = progressionHistoryReducer(history, { type: "sync-bpm", bpm: 96 });
    history = progressionHistoryReducer(history, { type: "undo" });

    expect(history.present.bars[0].cells[0]).toEqual(initial.bars[0].cells[0]);
    expect(history.present.bpm).toBe(96);
    expect(history.future).toHaveLength(1);

    history = progressionHistoryReducer(history, { type: "redo" });

    expect(history.present.bars[0].cells[0]).toEqual(editedCell);
    expect(history.present.bpm).toBe(96);
    expect(history.future).toHaveLength(0);
  });
});
