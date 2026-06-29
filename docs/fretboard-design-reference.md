# Fretboard Design Reference

この文書は、指板 UI を改善するときの参考メモである。

外部サイトの SVG や DOM をそのまま取り込むのではなく、見た目・情報設計・操作感の要素を分解し、このアプリ向けに再設計するための観察メモとして扱う。

## 参考

- Guitar Chord Viewer: `https://amashimacreate.github.io/guitar-chord-viewer/`

## 良さそうな要素

- 指板カードを暗い面として独立させ、周囲のパネルより少し強い主役感を出している。
- フレット線、弦、ポジションマーカーのコントラストが控えめで、音名・度数マーカーが前に出る。
- 構成音の丸が大きく、Root / 3rd / 5th の識別がひと目で分かる。
- 音名や度数の色が一貫していて、パネル内の選択状態とも対応している。
- カード内にコード名、構成音、フォーム候補がまとまっていて、指板だけが孤立していない。
- 水平指板の下に全体指板の俯瞰ビューがあり、局所と全体の関係が分かりやすい。

## このアプリに取り入れたい方向

- `BassFretboard` は実楽器の木目表現より、学習用の読みやすいダーク指板へ寄せる。
- 弦とフレットは少し細く、低コントラストにして、構成音マーカーを主役にする。
- 度数マーカーは現在よりカード UI と色の文脈を揃え、Root だけを明確に強調する。
- フレット番号は強いバッジではなく、補助情報として控えめにする。
- 開放弦の位置は視覚的に分かりやすくしつつ、通常フレット上のマーカーと混ざらないようにする。
- 将来的には、メイン指板とは別に小さな overview 指板を置き、表示範囲や現在コードの全体像を見せる。

## SVG / Element 設計メモ

実装では、外部 SVG をコピーせず、既存の `BassFretboard` SVG をベースに次のレイヤーを整理する。

```text
fretboard shell
├─ board background
├─ alternate fret lane shade
├─ nut
├─ fret lines
├─ position markers
├─ strings
├─ chord tone hit areas
│  ├─ note halo
│  ├─ note circle
│  ├─ degree label
│  └─ note name
└─ fret labels
```

今後の調整では、SVG 構造を大きく変える前に CSS class の責務を整理する。

- `fingerboard`: 指板面の色、角丸、影。
- `fret`: フレット線の太さと明度。
- `bassString`: 弦の太さ、明度、低音弦の重さ。
- `positionMarker`: ポジションマーカーの控えめな表示。
- `noteHit`: クリック可能な構成音マーカー。
- `noteHalo`: Root や現在音の強調。
- `degreeLabel`: 度数表示。
- `noteName`: 音名表示。

## 実装時の注意

- 参考元の SVG path、class 名、DOM 構造、CSS 値をそのまま移植しない。
- まずは `app/components/practice/BassFretboard.tsx` のレイヤー構造を保ち、CSS の調整から始める。
- 操作対象は丸全体にし、見た目を小さくしてもクリック領域は狭くしすぎない。
- モバイル指板にも同じ視覚言語を反映する。
- 色を増やしすぎず、Root / chord tone / guide tone / inactive の役割ごとに整理する。
