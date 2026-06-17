"use client";

import { type FretRange } from "../lib/music";

type FretRangeTabsProps = {
  fretRanges: readonly FretRange[];
  selectedFretRangeId: FretRange["id"];
  onSelectFretRange: (fretRangeId: FretRange["id"]) => void;
};

export function FretRangeTabs({
  fretRanges,
  selectedFretRangeId,
  onSelectFretRange,
}: FretRangeTabsProps) {
  return (
    <div className="fretRangeTabs" role="tablist" aria-label="表示するフレット範囲">
      {fretRanges.map((range) => (
        <button
          type="button"
          role="tab"
          aria-selected={selectedFretRangeId === range.id}
          className={selectedFretRangeId === range.id ? "fretRangeTab active" : "fretRangeTab"}
          key={range.id}
          onClick={() => onSelectFretRange(range.id)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
