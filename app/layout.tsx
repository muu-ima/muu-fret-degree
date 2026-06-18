import type { Metadata } from "next";
import { Inter, JetBrains_Mono, M_PLUS_Rounded_1c } from "next/font/google";
import { AppShell } from "./components/AppShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const rounded = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-title",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
});

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
      <body className={`${inter.variable} ${rounded.variable} ${mono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
