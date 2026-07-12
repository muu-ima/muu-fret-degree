# Music Theory Notes

このアプリでは、音高の一致判定と音名の綴りを分けて扱う。

フレット上の音には、`G#` / `Ab` のように同じ音高を表す複数の名前がある。ただし、コード内で常にどちらを使ってもよいわけではない。たとえば `Emaj7` の3度は `Ab` ではなく `G#` と綴る。度数に対応する音名の文字を保つ必要があるため。

```txt
Emaj7 = E G# B D#
        1 3  5 7
```

## アプリでの扱い

1. 各フレットの MIDI ノートを、内部用のシャープ系ピッチクラスへ変換する。
2. そのピッチクラスを、選択中のコード構成音と照合する。
3. 表示する音名は、選択中のルート音と度数から綴り直す。

これにより、異名同音の判定はシンプルに保ちながら、表示上は音楽的に正しい音名を出せる。

## コード定義の形式

コード定義は `data/theory.json` に置く。

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

- `degree` は指板上に表示する度数ラベルと、音名を綴るときの目標文字を決める。
- `semitones` はルートからの実際の半音距離を決める。

## チューニング定義の形式

チューニング定義も `data/theory.json` に置く。

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

表示順は高音弦から低音弦で、SVG 上では上から下へ並ぶ。

## コード再生の音域と転回形

`Chord` 再生は、ピアノ音色でコード構成音をまとめて鳴らす。ピアノの中央のドを `C4` として扱い、基準オクターブと転回形を UI で選べる。

```txt
中央のド = C4 = MIDI 60
```

仕様:

- `Chord` ボタンはピアノ音色で鳴らす。
- 基準オクターブは `C3`, `C4`, `C5` から選べる。
- 初期値は `C4` を含む中央音域にする。
- 転回形はコード構成音数に合わせて `Root`, `1st Inv`, `2nd Inv`, `3rd Inv` を表示する。
- ルートが `C` の場合、基本形の `Cmaj7` は `C4 E4 G4 B4` のように鳴る。
- ルートが `E` の場合、`Emaj7` は `E4 G#4 B4 D#5` のように、構成音の順序を保ちながら必要に応じて次のオクターブへ上げる。
- 1st inversion は最下音を1つ上へ回し、例: `Cmaj7` なら `E4 G4 B4 C5` のように鳴る。

実装時は、音名表示用の enharmonic spelling と、再生用の MIDI 番号計算を分けて考える。表示は度数に従って `G#` / `Ab` を正しく綴り、再生は `C4 = 60` を基準に MIDI 番号へ変換する。

## スケール譜面の拡張方針

`/scales` では、12音階すべてのスケールを五線譜で確認し、ブラウザ印刷からPDFとして保存できるようにする。

短期的には、`Major Scale` と `Natural Minor Scale` から始める。中期的には、練習や理論確認で使うスケールを `app/lib/scales.ts` に順次追加し、同じUIで切り替えられるようにする。

学習用の表示として、親キーに対するダイアトニック7モードをまとめて切り替えられるようにする。たとえば Key D Major では、`D Major`, `E Dorian`, `F# Phrygian`, `G Lydian`, `A Mixolydian`, `B Aeolian / Natural Minor`, `C# Locrian` を同じシート上で確認できるようにする。

追加していく候補:

- Major
- Natural Minor
- Harmonic Minor
- Melodic Minor
- Major Pentatonic
- Minor Pentatonic
- Blues
- Dorian
- Phrygian
- Lydian
- Mixolydian
- Aeolian
- Locrian
- Whole Tone
- Diminished / Half-Whole Diminished
- Chromatic

スケール定義は、コード定義と同じように `degree` と `semitones` を持たせる。

```ts
{
  id: "major",
  name: "Major Scale",
  shortName: "Major",
  intervals: [
    { degree: "1", semitones: 0 },
    { degree: "2", semitones: 2 },
    { degree: "3", semitones: 4 },
    { degree: "4", semitones: 5 },
    { degree: "5", semitones: 7 },
    { degree: "6", semitones: 9 },
    { degree: "7", semitones: 11 },
    { degree: "8", semitones: 12 }
  ]
}
```

実装時の注意:

- 表示上の音名は、既存の `spellIntervalNote` を使って度数から綴る。
- 1オクターブ上のルートは `8` として表示し、9th系を追加するときも同じ度数ラベルの延長として扱う。
- MIDI番号は譜面上の音域と再生音域を分けて扱えるようにする。
- 五線譜描画は VexFlow に寄せ、臨時記号、休符、小節線、連桁、タイ、スラーなどをあとから扱えるようにする。
- PDF出力は、当面は `window.print()` と印刷CSSで行う。将来的にサーバー生成PDFが必要になったら、同じスケール定義を使って別出力を追加する。

### スケールとモードの選択方針

スケールは単に音を順番に並べるためだけではなく、コードに対してどんな色を出したいかを選ぶための材料として扱う。コードトーンは骨格であり、スケールやモードはその骨格に乗せる明るさ、暗さ、抜け、緊張感、民族感を決める。

最初の整理は Major / Minor を軸にする。

- Major系: Ionian, Lydian, Mixolydian
- Minor系: Aeolian, Dorian, Phrygian, Locrian

チャーチモードは、Major Scaleの各音を主役にした見方でもあり、コードに対して親和性の高い音の並びでもある。

```txt
Key C Major:
Cmaj7  -> C Ionian
Dm7    -> D Dorian
Em7    -> E Phrygian
Fmaj7  -> F Lydian
G7     -> G Mixolydian
Am7    -> A Aeolian
Bm7b5  -> B Locrian
```

ノンダイアトニックコードでは、キー内で自動的に決まるモードではなく、そのコードをどう聴かせたいかで候補を選ぶ。たとえば m7 コードなら、コードトーン `1 b3 5 b7` は Dorian / Aeolian / Phrygian のいずれにも含まれるが、出る色が変わる。

```txt
D Dorian   = D E F G A B  C  -> 暗いが6度で抜ける
D Aeolian  = D E F G A Bb C  -> 暗く沈む
D Phrygian = D Eb F G A Bb C -> b2で緊張感が強い
```

実装上も、将来的にはスケールを「音の集合」としてだけでなく、コードタイプに対する候補や特徴音を説明できるようにする。

- `m7`: Dorian / Aeolian / Phrygian
- `maj7`: Ionian / Lydian
- `7`: Mixolydian / Altered / Phrygian Dominant など
- `m7b5`: Locrian など

UIでは、単にスケール名を並べるだけでなく、将来的に「このコードに対して使いやすいスケール」「特徴音」「響きの説明」を表示できる余地を残す。

## 今後のコード進行再生メモ

将来的には、単一コードだけではなく、16小節または32小節分のコード進行を UI 上で入力し、BPM に合わせて現在の小節・拍を判定しながら指板表示を自動で切り替えられるようにする。

目的は、曲や練習パターンの進行に合わせて、いま鳴っているコードの構成音をリアルタイムに指板へ表示すること。これにより、コードトーン練習、ウォーキングベース練習、アドリブ練習に使える。

想定する処理の流れ:

1. コード進行データを UI で入力する。
2. BPM と拍子から、1拍・1小節の長さを計算する。
3. 再生開始時刻からの経過時間を取得する。
4. 経過時間から現在の小節番号と拍位置を判定する。
5. 現在の小節に設定されたコードへ、指板表示を切り替える。

基本計算:

```txt
1拍の秒数 = 60 / BPM
1小節の秒数 = 1拍の秒数 * 拍子の拍数
現在の拍 = floor(経過秒数 / 1拍の秒数)
現在の小節 = floor(現在の拍 / 拍子の拍数)
小節内の拍 = 現在の拍 % 拍子の拍数
```

最初は 4/4 拍子固定でよい。あとから 3/4, 6/8 などを追加できるように、拍子はデータとして持てる設計にする。

コード進行データの例:

```json
{
  "bpm": 120,
  "timeSignature": { "beatsPerBar": 4, "beatUnit": 4 },
  "bars": [
    {
      "bar": 1,
      "cells": [
        { "root": "C", "chordTypeId": "maj7" },
        { "root": "A", "chordTypeId": "m7" }
      ]
    },
    {
      "bar": 2,
      "cells": [
        { "root": "D", "chordTypeId": "m7" },
        { "root": "G", "chordTypeId": "7" }
      ]
    }
  ]
}
```

UI の案:

- 4小節 / 8小節 / 16小節を切り替えられる。
- 各小節を 2 拍単位に分けて、前半 / 後半の Root と Chord を入力できる。
- 進行編集は別ページに分ける。
- BPM を数値入力できる。
- Play / Stop / Reset を用意する。
- 現在の小節をハイライトする。
- 現在の 2 拍セルをハイライトする。
- 現在の小節のコードを指板表示に反映する。
- 将来的には 32小節や、各小節に複数コード、例: 2拍ずつ `Dm7 / G7` も入力できるようにする。

実装時の注意:

- 音声再生のタイミングと画面更新のタイミングは分けて考える。
- 画面更新は `requestAnimationFrame` で現在時刻を監視する。
- 音を鳴らす場合は Web Audio API の `AudioContext.currentTime` を基準にする。
- 指板表示は現在の `root` / `chordType` state を、進行再生中だけ現在小節のコードに同期させる。
- 手動でコードを選んで学習するモードと、進行に沿って自動切り替えするモードを分ける。

## 状態保存メモ

ユーザーが前回の設定から練習を再開できるように、アプリの状態をブラウザストレージへ保存する。

保存先:

- `localStorage`: ブラウザを閉じても設定を残すために使う。

保存キー:

```txt
muu-fret-degree:practice-settings
```

保存する状態:

- 選択中の Root
- 選択中の Chord
- 選択中の Tuning
- 表示中のフレット範囲、例: `0-12F` / `13-22F`
- Chord 再生の基準オクターブ
- Chord 再生の転回形
- ガイドトーン強調の ON/OFF
- BPM
- コード進行データ、現時点では 2 / 4 / 8 / 16 小節ループの 2 拍セル Root / Chord
- 将来的には 32小節の入力内容

実装:

1. アプリ起動時に `localStorage` から保存済み state を読む。
2. 保存値が存在し、現在の `theory.json` に存在する Root / Chord / Tuning なら state に反映する。
3. ユーザーが設定を変更したら、`useEffect` で `localStorage` に保存する。
4. 保存データには `version` を持たせ、将来データ構造が変わったときに破棄または移行できるようにする。

保存データ例:

```json
{
  "version": 1,
  "root": "C",
  "chordTypeId": "maj",
  "tuningId": "standard",
  "fretRangeId": "low",
  "chordOctaveId": "C4",
  "chordInversion": 0,
  "showGuideTones": true,
  "bpm": 120
}
```

注意点:

- Next.js ではサーバー側レンダリング時に `window` が存在しないため、読み書きは client component の `useEffect` 内で行う。
- 壊れた保存データが入っていてもアプリが落ちないように、JSON parse は `try/catch` で扱う。
- 保存された Chord ID が現在の `theory.json` に存在しない場合は、デフォルト値へ戻す。

## 現在の制限

- 現在の指板表示は 0-12F と 13-22F をタブで切り替える構成。
- 現在の音名綴りヘルパーは、7th 系までの一般的なコードトーンを中心に設計している。
- 9th, 11th, 13th などのテンションを扱う場合は、`app/page.tsx` の度数から文字ステップへの対応表を拡張する必要がある。
