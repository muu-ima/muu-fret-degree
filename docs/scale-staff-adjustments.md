# スケール譜面の個別調整履歴

`/scales` の五線譜は、まず共通の密度計算で調整する。
それでもモバイル幅で見切れ、詰まり、上下の重心ずれが残る場合だけ、スケールとキーごとの個別補正を追加する。

補正は表示上の読みやすさのために使い、スケール定義、音名、度数、MIDI番号は変更しない。

## 確認幅

- `375px`: 狭いモバイル幅。最優先で見切れを避ける。
- `390px`: 6.1インチ級スマホの主基準。
- `425px`: 余裕のあるスマホ幅。

## 位置基準

- Compact表示では、臨時記号がなく最も自然に見えるD Dorianを基準位置にする。
- 他キーは、臨時記号の有無に関わらず、1度から8度までの音符本体がD Dorianの見え方に近づくようにする。
- Dorianの調整では、臨時記号の数で横幅を大きく変えない。音符本体の横密度はD Dorianに合わせ、臨時記号が多いキーだけ音符サイズ、臨時記号サイズ、個別offsetで詰まりを逃がす。
- Majorなど調号を使うスケールは、調号ぶんの横幅を確保するため共通のreserveを使い、Dorian用の詰め方を流用しない。
- Compact表示で臨時記号が付かない音符は、セル内で左寄りに見えやすいため、音符本体とラベルを同じ量だけ右へ寄せて中央に近づける。ただしD Dorianの自然な並びを崩さない量に留める。
- 臨時記号が多いキーでも、音符本体の基本位置はD Dorian基準に合わせる。密度調整用の`noteShift`を打ち消し、臨時記号の有無で音符本体が左へ寄りすぎないようにする。
- 基準は相対位置で扱う。375px幅では、D Dorianの1度Dから8度Dまでが左右に寄りすぎない位置を目安にする。

## 調整履歴

| Date | Scale | Key | Viewport | Adjustment | Reason |
| --- | --- | --- | --- | --- | --- |
| 2026-07-08 | Dorian | C | Compact | `staveY: 19`, `accidentalScale: 0.9`, `signatureReserve: 48` | 375px前後で下方向の余白を少し確保し、2つだけの臨時記号に対して右側の余白が残りすぎないようにするため。 |
| 2026-07-08 | Dorian | C# | Compact | `staveY: 19`, `noteScale: 0.86`, `accidentalScale: 0.78`, `noteShift: 6`, `signatureReserve: 50`, `noteOffsets: { 6: 3 }`, `labelOffsets: { 1: -1, 6: 2 }` | 6つのシャープを小さく保ちつつ、1度から8度までの音符本体がD Dorianの自然な横並びに近づくようにする。b3のEは臨時記号なし音符の共通中央寄せに任せ、b7のBだけ右へ寄せるため。 |
| 2026-07-08 | Dorian | D | Compact | `staveY: 19`, `accidentalScale: 0.9`, `signatureReserve: 48` | 臨時記号がなく最も自然に見えるため、Compact表示の基準形として扱う。 |
| 2026-07-08 | Dorian | Eb | Compact | `staveY: 19`, `noteScale: 0.86`, `accidentalScale: 0.78`, `noteShift: 6`, `signatureReserve: 50`, `noteOffsets: { 2: 2, 6: 2 }`, `labelOffsets: { 2: 1, 6: 1 }` | 5つのフラットで左側が詰まりやすいため、臨時記号を小さくしつつb3のGbとb7のDbを少し右へ逃がす。横密度はD Dorianへ寄せ、臨時記号数で余白を増やしすぎないため。 |
| 2026-07-12 | Dorian | Ab | Compact | `staveY: 19`, `noteScale: 0.86`, `accidentalScale: 0.78`, `noteShift: 6`, `signatureReserve: 50`, `noteOffsets: { 2: 2, 6: 2 }`, `labelOffsets: { 2: 1, 6: 1 }` | フラットが多く左側が詰まりやすいため、E♭系と同じ密度でD Dorianの基準位置に寄せつつ、b3のCbとb7のGbを少し右へ逃がすため。 |
| 2026-07-12 | Dorian | Bb | Compact | `staveY: 19`, `noteScale: 0.9`, `accidentalScale: 0.84`, `noteShift: 4`, `signatureReserve: 50`, `noteOffsets: { 2: 2, 6: 2 }`, `labelOffsets: { 2: 1, 6: 1 }` | A♭より臨時記号が少ないため少し広めの音符サイズを保ち、D Dorianの基準位置に寄せつつb3のDbとb7のAbを少し右へ逃がすため。 |
| 2026-07-08 | All | All | Desktop | default reserves `52, 56, 60, 64, 68, 72, 76, 80` | デスクトップ2列表示で五線譜の右側に余白が残りやすいため、縦方向は維持したまま音符列のX方向だけを譜面幅に近づけるため。 |
| 2026-07-08 | All | Notes | Compact | all notes cancel `noteShift`, natural notes add `compactNaturalNoteCenterOffset: 3` | 臨時記号の有無に関わらず音符本体の基本位置をD Dorian基準に合わせる。臨時記号が付かない音符はセル内で左寄りに見えるため、音符本体とラベルを同じX補正でさらに少し右へ寄せる。 |
| 2026-07-12 | Dorian | All | Compact | Keep shared compact reserves unchanged; use Dorian key overrides for tighter spacing | Majorなど調号を使うスケールの音符がはみ出ないよう、共通reserveは安全側に戻し、Dorianだけ個別overrideでD Dorian基準へ寄せるため。 |
