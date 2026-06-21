import type { Metadata } from "next";
import { ProgressionEditorWorkspace } from "../components/progression/ProgressionEditorWorkspace";

export const metadata: Metadata = {
  title: "Progression Edit | Bass Chord Degree Fretboard",
};

export default function ProgressionPage() {
  return <ProgressionEditorWorkspace />;
}
