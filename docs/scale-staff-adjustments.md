# スケール譜面の個別調整履歴

`/scales` の五線譜は、まず共通の密度計算で調整する。
それでもモバイル幅で見切れ、詰まり、上下の重心ずれが残る場合だけ、スケールとキーごとの個別補正を追加する。

補正は表示上の読みやすさのために使い、スケール定義、音名、度数、MIDI番号は変更しない。

## 確認幅

- `375px`: 狭いモバイル幅。最優先で見切れを避ける。
- `390px`: 6.1インチ級スマホの主基準。
- `425px`: 余裕のあるスマホ幅。

## 位置基準

- Compact表示では、Major Scaleの並びを最も自然な基準として扱う。
- 音符ごとの絶対座標を個別に持つのではなく、VexFlowの`Formatter`による相対配置を基本にする。
- Majorの見え方に近づくよう、臨時記号数に応じた共通の`signatureReserve`、`noteShift`、`noteScale`で密度を決める。
- Dorianなど調号を使わず臨時記号を直接表示するスケールも、Majorと同じ共通密度ルールを使う。
- 調号なしスケールでは、臨時記号が付かない音符だけが左に詰まって見えやすい。Compact表示では音符本体とラベルを同じ量だけ右へ寄せ、臨時記号付き音符の視覚的な重心に近づける。
- 下の音名・度数ラベルは、VexFlowが出した音符のX位置を基準に`%`で追従させる。音符だけ、またはラベルだけを単独で動かさない。
- 個別offsetは最後の例外処理に限定する。対象は、臨時記号の衝突、見切れ、明らかな視覚ズレが残るキーだけにする。
- 基準は相対位置で扱う。375px幅では、Major Scaleの1度から8度までが左右に寄りすぎず、ラベルと音符が揃って見える位置を目安にする。

## 調整履歴

| Date | Scale | Key | Viewport | Adjustment | Reason |
| --- | --- | --- | --- | --- | --- |
| 2026-07-08 | All | All | Desktop | default reserves `52, 56, 60, 64, 68, 72, 76, 80` | デスクトップ2列表示で五線譜の右側に余白が残りやすいため、縦方向は維持したまま音符列のX方向だけを譜面幅に近づけるため。 |
| 2026-07-08 | All | Notes | Compact | Use shared density profile from VexFlow positions; labels follow note X positions | 12キー×複数スケールを個別座標で調整するのは破綻しやすいため、Major Scaleで自然に見える共通の横幅感を基準にする。 |
| 2026-07-12 | Dorian | All | Compact | Remove Dorian-specific compact overrides; keep only shared density rules | Dorianだけを個別に詰めるとMajor Scaleとの差が大きくなり、スケールを切り替えた時の違和感が増えるため。 |
| 2026-07-12 | Accidentals | Natural notes | Compact | `compactNaturalNoteCenterOffset: 3` for notes without written accidentals in no-key-signature scales | 人間の視覚では臨時記号込みの塊で音を読むため、臨時記号なしの音符を少し右へ寄せて、左詰まりに見える状態を軽減するため。 |
