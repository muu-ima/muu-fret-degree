import type { Metadata } from "next";

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
      </header>

      <section className="scalePrintSheet" aria-label="Training">
        <div className="scalePrintHeader">
          <div>
            <p>Practice Builder</p>
            <h2>Training</h2>
          </div>
          <div className="scaleSheetHeaderTools">
            <span>Ready for focused drills</span>
          </div>
        </div>
      </section>
    </main>
  );
}
