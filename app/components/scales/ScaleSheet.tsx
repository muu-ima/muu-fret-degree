"use client";

import { useMemo, useState } from "react";
import { LuPrinter } from "react-icons/lu";
import theory from "../../../data/theory.json";
import { makeScaleNotes, scaleDefinitions, type ScaleId } from "../../lib/scales";
import { ScaleStaff } from "./ScaleStaff";

export function ScaleSheet() {
  const [scaleId, setScaleId] = useState<ScaleId>("major");
  const selectedScale = scaleDefinitions.find((scale) => scale.id === scaleId) ?? scaleDefinitions[0];

  const rows = useMemo(
    () =>
      theory.roots.map((root) => ({
        root,
        notes: makeScaleNotes(root, selectedScale),
      })),
    [selectedScale],
  );

  return (
    <main className="scalePage">
      <header className="scaleToolbar">
        <div>
          <p className="panelEyebrow">Notation</p>
          <h1>12-Key Scale Sheet</h1>
        </div>

        <div className="scaleToolbarControls">
          <label className="scaleSelectLabel">
            <span>Scale</span>
            <select value={scaleId} onChange={(event) => setScaleId(event.target.value as ScaleId)}>
              {scaleDefinitions.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.name}
                </option>
              ))}
            </select>
          </label>

          <button className="scalePrintButton" type="button" onClick={() => window.print()} title="Print or save as PDF">
            <LuPrinter aria-hidden="true" />
            <span>PDF</span>
          </button>
        </div>
      </header>

      <section className="scalePrintSheet" aria-label={`${selectedScale.name} in all 12 keys`}>
        <div className="scalePrintHeader">
          <div>
            <p>12-Key Scale Sheet</p>
            <h2>{selectedScale.name}</h2>
          </div>
          <span>Bass clef / one octave</span>
        </div>

        <div className="scaleStaffGrid">
          {rows.map((row) => (
            <ScaleStaff key={row.root} root={row.root} scaleName={selectedScale.shortName} notes={row.notes} />
          ))}
        </div>
      </section>
    </main>
  );
}
