"use client";

import { useMemo, useState } from "react";
import { LuPrinter } from "react-icons/lu";
import theory from "../../../data/theory.json";
import { makeDiatonicModeRows, makeScaleNotes, modeSheetLabel, scaleDefinitions, type ScaleId } from "../../lib/scales";
import { ScaleStaff } from "./ScaleStaff";

const rootRanges = [
  { id: "all", label: "All", roots: theory.roots },
  { id: "c-e", label: "C-E", roots: theory.roots.slice(0, 6) },
  { id: "f-b", label: "F-B", roots: theory.roots.slice(6) },
] as const;

type RootRangeId = (typeof rootRanges)[number]["id"];
type ScaleSheetMode = "scale" | "key-modes";
type ScaleSheetRow = {
  heading?: string;
  meta?: string;
  root: string;
  scaleId: ScaleId;
  scaleName: string;
  notes: ReturnType<typeof makeScaleNotes>;
};

export function ScaleSheet() {
  const [sheetMode, setSheetMode] = useState<ScaleSheetMode>("scale");
  const [scaleId, setScaleId] = useState<ScaleId>("major");
  const [keyRoot, setKeyRoot] = useState<string>("C");
  const [rootRangeId, setRootRangeId] = useState<RootRangeId>("all");
  const selectedScale = scaleDefinitions.find((scale) => scale.id === scaleId) ?? scaleDefinitions[0];
  const selectedRootRange = rootRanges.find((range) => range.id === rootRangeId) ?? rootRanges[0];
  const isKeyModeSheet = sheetMode === "key-modes";

  const rows = useMemo<ScaleSheetRow[]>(
    () => {
      if (isKeyModeSheet) {
        return makeDiatonicModeRows(keyRoot).map((row) => ({
          heading: `${row.roman} ${row.root}`,
          meta: row.chordQuality,
          root: row.root,
          scaleId: row.scale.id as ScaleId,
          scaleName: modeSheetLabel(row.scale),
          notes: makeScaleNotes(row.root, row.scale),
        }));
      }

      return selectedRootRange.roots.map((root) => ({
        root,
        scaleId: selectedScale.id,
        scaleName: selectedScale.shortName,
        notes: makeScaleNotes(root, selectedScale),
      }));
    },
    [isKeyModeSheet, keyRoot, selectedRootRange, selectedScale],
  );

  const sheetTitle = isKeyModeSheet ? `Diatonic Modes in Key ${keyRoot}` : selectedScale.name;
  const sheetLabel = isKeyModeSheet ? "Key Mode Sheet" : "12-Key Scale Sheet";
  const gridClassName = isKeyModeSheet || rootRangeId !== "all" ? "scaleStaffGrid focused" : "scaleStaffGrid";

  return (
    <main className="scalePage">
      <header className="scaleToolbar">
        <div>
          <p className="panelEyebrow">Notation</p>
          <h1>{isKeyModeSheet ? "Key Mode Scale Sheet" : "12-Key Scale Sheet"}</h1>
        </div>

        <div className="scaleToolbarControls">
          <label className="scaleSelectLabel compact">
            <span>View</span>
            <select value={sheetMode} onChange={(event) => setSheetMode(event.target.value as ScaleSheetMode)}>
              <option value="scale">12-Key</option>
              <option value="key-modes">Key Modes</option>
            </select>
          </label>

          <label className="scaleSelectLabel">
            <span>{isKeyModeSheet ? "Key" : "Scale"}</span>
            {isKeyModeSheet ? (
              <select value={keyRoot} onChange={(event) => setKeyRoot(event.target.value)}>
                {theory.roots.map((root) => (
                  <option key={root} value={root}>
                    {root} Major
                  </option>
                ))}
              </select>
            ) : (
              <select value={scaleId} onChange={(event) => setScaleId(event.target.value as ScaleId)}>
                {scaleDefinitions.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <button className="scalePrintButton" type="button" onClick={() => window.print()} title="Print or save as PDF">
            <LuPrinter aria-hidden="true" />
            <span>PDF</span>
          </button>
        </div>
      </header>

      <section className="scalePrintSheet" aria-label={sheetTitle}>
        <div className="scalePrintHeader">
          <div>
            <p>{sheetLabel}</p>
            <h2>{sheetTitle}</h2>
          </div>
          <div className="scaleSheetHeaderTools">
            {!isKeyModeSheet && (
              <div className="scaleRangeTabs" role="tablist" aria-label="Root range">
                {rootRanges.map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    role="tab"
                    aria-selected={rootRangeId === range.id}
                    className={rootRangeId === range.id ? "active" : ""}
                    onClick={() => setRootRangeId(range.id)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
            <span>Bass clef / one octave</span>
          </div>
        </div>

        <div className={gridClassName}>
          {rows.map((row) => (
            <ScaleStaff
              key={`${row.root}-${row.scaleId}`}
              heading={row.heading}
              meta={row.meta}
              root={row.root}
              scaleId={row.scaleId}
              scaleName={row.scaleName}
              notes={row.notes}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
