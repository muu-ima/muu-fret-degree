import type { Metadata } from "next";
import { ScaleSheet } from "../components/scales/ScaleSheet";

export const metadata: Metadata = {
  title: "Scale Sheet | Bass Chord Degree Fretboard",
};

export default function ScalesPage() {
  return <ScaleSheet />;
}
