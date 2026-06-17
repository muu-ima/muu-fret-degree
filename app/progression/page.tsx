import type { Metadata } from "next";
import { PracticeWorkspace } from "../components/PracticeWorkspace";

export const metadata: Metadata = {
  title: "Progression Edit | Bass Chord Degree Fretboard",
};

export default function ProgressionPage() {
  return <PracticeWorkspace showProgressionEditor />;
}
