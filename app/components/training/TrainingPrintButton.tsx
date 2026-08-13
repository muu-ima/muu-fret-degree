"use client";

import { LuPrinter } from "react-icons/lu";

export function TrainingPrintButton() {
  return (
    <button className="scalePrintButton" type="button" onClick={() => window.print()} title="Print or save as PDF">
      <LuPrinter aria-hidden="true" />
      <span>PDF</span>
    </button>
  );
}
