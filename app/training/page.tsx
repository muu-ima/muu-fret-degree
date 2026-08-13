import type { Metadata } from "next";
import { EMajorTripletStudy } from "../components/training/EMajorTripletStudy";
import { TrainingPrintButton } from "../components/training/TrainingPrintButton";

export const metadata: Metadata = {
  title: "Training | Bass Chord Degree Fretboard",
};

export default function TrainingPage() {
  return (
    <main className="scalePage">
      <header className="scaleToolbar">
        <div>
          <p className="panelEyebrow">Training</p>
          <h1>Training</h1>
        </div>

        <div className="scaleToolbarControls">
          <TrainingPrintButton />
        </div>
      </header>

      <section className="scalePrintSheet" aria-label="Training">
        <div className="scalePrintHeader">
          <div>
            <p>Scale Drill</p>
            <h2>E Major Triplets</h2>
          </div>
          <div className="scaleSheetHeaderTools">
            <span>2-octave wave to low E, then restart / 4-4</span>
          </div>
        </div>

        <EMajorTripletStudy />
      </section>
    </main>
  );
}
