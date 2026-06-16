# Music Theory Notes

This app separates pitch matching from note spelling.

A fret position has a pitch class, such as `G#` / `Ab`. Those two names can refer to the same sounding pitch, but they are not always the correct spelling in a chord. For example, in `Emaj7`, the third is `G#`, not `Ab`, because scale-degree spelling must preserve the letter name of the degree:

```txt
Emaj7 = E G# B D#
        1 3  5 7
```

## How The App Handles This

1. Convert each fret's MIDI note into an internal sharp pitch class.
2. Match that pitch class against the selected chord formula.
3. Spell the displayed note name from the selected root and interval degree.

This keeps enharmonic matching simple while still displaying musically correct names.

## Chord Formula Shape

Chord formulas live in `data/theory.json`:

```json
{
  "id": "m7",
  "name": "Minor 7",
  "intervals": [
    { "degree": "1", "semitones": 0 },
    { "degree": "b3", "semitones": 3 },
    { "degree": "5", "semitones": 7 },
    { "degree": "b7", "semitones": 10 }
  ]
}
```

- `degree` controls the label shown on the fretboard and the target letter used for spelling.
- `semitones` controls the actual pitch distance from the root.

## Tuning Data Shape

Tunings also live in `data/theory.json`:

```json
{
  "id": "standard",
  "name": "4 String Standard",
  "strings": [
    { "name": "G", "note": "G", "midi": 43 },
    { "name": "D", "note": "D", "midi": 38 },
    { "name": "A", "note": "A", "midi": 33 },
    { "name": "E", "note": "E", "midi": 28 }
  ]
}
```

The display order is high string to low string, matching the SVG layout from top to bottom.

## Known Limits

- The current fretboard covers open strings through the 12th fret.
- The current spelling helper is designed around common chord tones up to seventh-based structures.
- More advanced extensions, such as 9ths, 11ths, and 13ths, should extend the degree-to-letter-step table in `app/page.tsx`.
