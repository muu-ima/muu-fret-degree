# スケール譜面の個別調整履歴

`/scales` の五線譜は、まず共通の密度計算で調整する。
それでもモバイル幅で見切れ、詰まり、上下の重心ずれが残る場合だけ、スケールとキーごとの個別補正を追加する。

補正は表示上の読みやすさのために使い、スケール定義、音名、度数、MIDI番号は変更しない。

## 確認幅

- `375px`: 狭いモバイル幅。最優先で見切れを避ける。
- `390px`: 6.1インチ級スマホの主基準。
- `425px`: 余裕のあるスマホ幅。

## 調整履歴

| Date | Scale | Key | Viewport | Adjustment | Reason |
| --- | --- | --- | --- | --- | --- |
| 2026-07-08 | Dorian | C | Compact | `staveY: 19`, `accidentalScale: 0.9`, `signatureReserve: 48` | 375px前後で下方向の余白を少し確保し、2つだけの臨時記号に対して右側の余白が残りすぎないようにするため。 |
| 2026-07-08 | Dorian | C# | Compact | `staveY: 19`, `noteScale: 0.86`, `accidentalScale: 0.78`, `noteShift: 6`, `signatureReserve: 76`, `noteOffsets: { 2: 3, 6: 3 }`, `labelOffsets: { 1: -1, 2: 1, 6: 2 }` | 6つのシャープを小さく保ちつつ、1度のC#がC Dorianの1度Cに近い位置へ揃うようにする。ラベルはD#を少し左、b3のEとb7のBを少し右へ寄せてC Dorianのバランスに近づけるため。 |
| 2026-07-08 | Dorian | D | Compact | `staveY: 19`, `accidentalScale: 0.9`, `signatureReserve: 48` | 臨時記号がないためC Dorianと同じ基準幅へ寄せ、1度と8度の相対位置がC Dorianの基準形に近づくようにするため。 |
| 2026-07-08 | All | All | Desktop | default reserves `52, 56, 60, 64, 68, 72, 76, 80` | デスクトップ2列表示で五線譜の右側に余白が残りやすいため、縦方向は維持したまま音符列のX方向だけを譜面幅に近づけるため。 |
