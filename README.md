# muu-fret-degree

Electric bass fretboard chord degree viewer built with Next.js, TypeScript, SVG, JSON music theory data, and the Web Audio API.

ルート音とコードタイプを選ぶと、4弦エレキベースの指板上にコード構成音を度数で表示します。各ノートをクリックすると、その位置の音を Web Audio API で再生できます。

## Features

- SVG-rendered electric bass fretboard from open string to 12th fret
- Root, chord type, and tuning selectors
- Chord tones displayed as degrees such as `1`, `3`, `5`, `b7`
- Correct note spelling by chord degree, for example `Emaj7 = E G# B D#`
- Arpeggio and chord playback using the Web Audio API
- Music theory source data in `data/theory.json`

## Tech Stack

- Next.js
- TypeScript
- React
- SVG
- Web Audio API
- JSON theory data

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

日本語の操作説明は [`docs/user-guide.md`](docs/user-guide.md) を参照してください。

Build for production:

```bash
npm run build
```

## Project Structure

```txt
app/
  globals.css      Global styles for the fretboard UI
  layout.tsx       App shell and metadata
  page.tsx         Main interactive fretboard application
data/
  theory.json      Notes, chord formulas, and tuning data
docs/
  music-theory.md  Notes about interval spelling and data design
```

## Music Theory Data

Chord formulas and tunings live in `data/theory.json`. Each chord type stores intervals as semitone distances plus a degree label. The app uses semitone values for pitch matching, then spells the displayed note name from the selected root and degree.

Example:

```json
{
  "id": "maj7",
  "name": "Major 7",
  "intervals": [
    { "degree": "1", "semitones": 0 },
    { "degree": "3", "semitones": 4 },
    { "degree": "5", "semitones": 7 },
    { "degree": "7", "semitones": 11 }
  ]
}
```

## Repository

GitHub: https://github.com/muu-ima/nuu-fret-degree
