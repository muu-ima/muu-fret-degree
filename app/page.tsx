import type { Metadata } from "next";
import { PracticeWorkspace } from "./components/PracticeWorkspace";

export const metadata: Metadata = {
  title: "Bass Chord Degree Fretboard",
};

export default function Home() {
  return <PracticeWorkspace pageMode="practice" showProgressionEditor={false} />;
}
