# Architecture Notes

このアプリは、画面全体の状態管理、UI 部品、音楽理論の計算、音声再生を分けて扱う。

目的は、`app/page.tsx` にロジックと描画が集まりすぎないようにし、あとからコード進行、音域選択、状態保存などを追加しやすくすること。

## 責務の分け方

### `app/page.tsx`

ホームの練習ページを担当する。

- `PracticeWorkspace` を `showProgressionEditor=false` で表示する。
- Practice モードの入口として、指板と基本操作を見せる。

### `app/progression/page.tsx`

コード進行編集ページを担当する。

- `PracticeWorkspace` を `showProgressionEditor=true` で表示する。
- 進行編集を別ルートに分ける。

### `app/components/PracticeWorkspace.tsx`

アプリ共通の練習画面を担当する。

- 選択中の Root / Chord / Tuning / BPM などの state を持つ。
- `theory.json` から現在のコード種別やチューニングを選ぶ。
- `useMemo` で指板表示用データやコード構成音を作る。
- UI コンポーネントへ props とイベントハンドラを渡す。
- 音声 hook から受け取った再生関数を呼び出す。
- 進行再生中は、現在小節の Root / Chord を表示と再生へ反映する。
- ページ切り替えリンクを表示する。

ここには、大きな SVG 描画、音楽理論の細かい計算、AudioContext のライフサイクル、入力値の正規化ルールを置かない。画面の流れを読むためのファイルとして保つ。

### `app/components/BassFretboard.tsx`

指板の表示を担当する。

- デスクトップ向けの横指板を描画する。
- モバイル向けの縦指板を描画する。
- フレット、弦、ポジションマーカー、コードトーンの見た目を組み立てる。
- ノートをクリックまたはキーボード操作したときに `onPlayNote` を呼ぶ。

このコンポーネントは、どの音がコードトーンかを自分では判定しない。渡された `FretNote[]` を表示するだけにする。

### `app/components/ControlsPanel.tsx`

コード、チューニング、BPM などの操作 UI を担当する。

- Root / Chord / Tuning の選択欄を表示する。
- ガイドトーン強調の切り替えを表示する。
- Arpeggio / Chord / Metronome の操作を表示する。
- BPM 入力を表示する。

このコンポーネントは state を持たず、変更は callback で親へ返す。デスクトップ表示とモバイルドロワーの両方で同じ操作 UI を再利用する。

### `app/components/ChordDegreeStrip.tsx`

選択中コードの構成音一覧を担当する。

- 度数ラベルと音名を表示する。
- ガイドトーン強調の見た目を切り替える。

このコンポーネントは、コード構成音の計算はしない。`page.tsx` から渡された `ChordNote[]` を表示する。

### `app/components/ProgressionPanel.tsx`

コード進行再生の操作と現在位置表示を担当する。

- Play / Stop / Reset を表示する。
- 現在の小節、2 拍セル、進行中のコードを表示する。
- 状態は持たず、`useProgressionPlayback` から受け取った値を表示するだけにする。

### `app/components/ProgressionEditor.tsx`

コード進行の小節ごとの Root / Chord を編集する。

- 4 / 8 / 16 小節のループを編集する。
- 各小節を 2 拍単位で分割し、前半 / 後半の Root と Chord を選択できる。
- 状態の保存はしない。編集内容は `PracticeWorkspace` の state に反映するだけにする。
- `Progression Edit` ページでのみ表示する。

編集内容そのものは `app/components/PracticeWorkspace.tsx` の state に反映する。

### `app/hooks/useAudioEngine.ts`

音声再生に必要な React state とブラウザ API の接続を担当する。

- `AudioContext` を必要になったタイミングで作る。
- ベース音、ピアノ音、メトロノーム音を鳴らす関数を返す。
- メトロノームの開始 / 停止、現在拍、タイマーを管理する。

この hook は、どのコードをどの順番で鳴らすかは決めない。`page.tsx` が選んだ MIDI 番号を、音声再生へつなぐ。

### `app/hooks/useBpmControl.ts`

BPM 入力の state と正規化を担当する。

- 再生に使う数値の BPM を持つ。
- 入力欄に表示する文字列の BPM を持つ。
- 数字以外の入力を無視する。
- 確定時に 40-240 の範囲へ丸める。

この hook は、メトロノームを鳴らす処理は持たない。メトロノーム側は、正規化済みの `bpm` だけを受け取る。

### `app/hooks/useChordPlayback.ts`

選択中コードをどう鳴らすかを担当する。

- 指板上の単音をベース音で鳴らす。
- コード構成音を低フレット側からアルペジオ再生する。
- コード構成音を、基準オクターブと転回形を反映したピアノ風の積み音で再生する。
- 進行再生中の拍ごとのベース音も鳴らす。

この hook は、実際の音色合成や `AudioContext` の管理はしない。`useAudioEngine` から受け取った再生関数へ、どの MIDI 番号を渡すかを決める。

### `app/hooks/useProgressionPlayback.ts`

コード進行再生の状態管理と現在位置の追跡を担当する。

- 再生の開始 / 停止 / リセットを扱う。
- `requestAnimationFrame` で経過秒数を更新する。
- `app/lib/progression.ts` の純粋関数を使って、現在の拍位置と選択中のセルを 1 回で求める。

この hook は、進行データそのものの編集はしない。入力された進行を時間に同期させる役割に絞る。

### `app/hooks/usePersistedProgression.ts`

コード進行の編集内容をブラウザ保存する。

- 進行の拍子と小節データを `localStorage` へ保存する。
- 保存値が壊れている場合や、Root / Chord が現在の候補にない場合は無視する。
- 読み込み時は既存 state の BPM を保ったまま、進行データだけ復元する。

### `app/hooks/usePersistedPracticeSettings.ts`

練習設定のブラウザ保存を担当する。

- 起動時に `localStorage` から保存済み設定を読む。
- Root / Chord / Tuning / fret range / chord octave / chord inversion / guide tone / BPM を保存する。
- 保存値が現在の `theory.json` や `fretRanges` に存在する場合だけ state に反映する。
- 保存データの `version` が違う場合や JSON が壊れている場合は無視する。

この hook は、設定 UI の表示や音声再生はしない。`page.tsx` から受け取った現在値と setter を、保存処理へつなぐ。

### `app/lib/music.ts`

音楽理論と表示データの計算を担当する。

- MIDI 番号からピッチクラスや音名を求める。
- ルート音と度数から音名を綴る。
- コード構成音の map を作る。
- 指板に表示する `FretNote[]` を作る。
- 音域や転回形を含むコード再生用の MIDI 番号を求める。

DOM、React state、Web Audio API には依存させない。純粋な計算に寄せることで、あとからテストを書きやすくする。

### `app/lib/progression.ts`

コード進行再生のデータ型と現在位置計算を担当する。

- BPM と拍子から 1 拍・1 小節の長さを求める。
- 経過秒数から現在の拍位置と小節番号を求める。
- 進行データから、現在参照すべき小節と 2 拍セルを選ぶ。
- 小節数を変更したときに、既存パターンを複製して伸縮する。

このモジュールは、再生中の時間管理や UI 更新は持たない。`requestAnimationFrame` や `AudioContext.currentTime` から得た値を受け取り、位置情報に変換する。

### `app/lib/audio.ts`

音声合成と再生を担当する。

- ベース音を鳴らす。
- ピアノ風のコード音を鳴らす。
- メトロノームクリックを鳴らす。

音楽理論上のコード判定や UI state はここに置かない。受け取った MIDI 番号や開始時刻を、Web Audio API で音にする。

### `data/theory.json`

音楽理論データを担当する。

- Root の候補を持つ。
- ChordType の定義を持つ。
- Tuning の定義を持つ。

アプリ固有の表示状態やユーザー設定はここに置かない。

## 新しい機能を足すときの目安

- 新しい UI 部品を足す場合は、まず `app/components` に置けるか考える。
- 音楽理論の計算を足す場合は、まず `app/lib/music.ts` に置く。
- 音の鳴らし方を変える場合は、まず `app/lib/audio.ts` に置く。
- Web Audio API と React state をつなぐ処理は、まず `app/hooks` に置く。
- 入力値の一時 state や正規化ルールは、まず `app/hooks` に置く。
- ユーザー操作から再生する MIDI 番号を選ぶ処理は、まず `app/hooks` に置く。
- ブラウザストレージなど外部状態との同期は、まず `app/hooks` に置く。
- アプリ全体の状態や、複数コンポーネントをつなぐ処理は `app/page.tsx` に置く。
- 同じ UI をデスクトップとモバイルで使う場合は、props で受ける stateless component にする。

## 今後分離したい候補

- コード進行 UI の入力フォーム。
- 小節ごとの編集や複数コード入力。

これらは機能が大きくなった時点で、`app/lib` の純粋関数、または React hooks として切り出す。
