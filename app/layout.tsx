import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bass Chord Degree Fretboard",
  description: "SVG bass fretboard that displays chord tones by degree.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
