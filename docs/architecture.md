# Architecture Notes

このアプリは、画面全体の状態管理、UI 部品、音楽理論の計算、音声再生を分けて扱う。

目的は、`app/page.tsx` にロジックと描画が集まりすぎないようにし、あとからコード進行、音域選択、状態保存などを追加しやすくすること。

## 画面設計の方針

このアプリの UI は、ダークテーマの共通シェルを土台にする。

- 左側にサイドバーを置き、`Practice` と `Progression Edit` を常設する。
- サイドバーはモードチェンジャーとして扱い、現在の画面と切り替え先を同時に見せる。
- ページ本体は、練習や編集の作業領域として中央に集中させる。
- ルートごとの差分は、サイドバーの選択状態と、中央に出すコンテンツだけに留める。
- モバイルではサイドバーを縮め、最低限の切り替え導線だけ残す。
- 各ページのヘッダーは、同じ骨格を保ちながら情報量だけを変える。
- モバイルでもダークテーマを維持し、白いパネルが唐突に出ないようにする。

この方針にすると、機能追加のたびにページの入口が迷子になりにくく、練習アプリらしい作業感も出しやすい。

### `muu-cardcraft` を参照した次段の UI 方針

次のレイアウト整理では、`muu-cardcraft` の構造を参考にしつつ、このアプリ向けに暗色へ翻訳する。

- 参考にするのは、配色そのものではなく、シェル構造、面の分け方、ツールパネルの役割、中央主役の置き方。
- `muu-cardcraft` の中央キャンバスに相当する場所は、このアプリでは `BassFretboard` を主役として扱う。
- 左側は、モード切り替えと補助パネルの入口を持つサイドバーにする。
- `Controls` は常設の大きなフォームではなく、必要な時に開くパネルへ寄せる。
- `Controls` の中身は、`Harmony` と `Playback` のように意味のまとまりで分ける。
- `Progression Edit` は、常に中央へ押し込まず、必要に応じて別パネルや別ページとして扱う。
- サイドバーの項目は、アイコン、短いラベル、短い補足文を組み合わせて、モードと機能の違いをひと目で分かるようにする。
- ダークテーマは維持しつつ、`muu-cardcraft` にあるガラス面、角丸、軽い浮き、補助ツールバーの考え方だけを取り込む。

この設計にすると、編集アプリのような「主役の作業面」と「補助操作」の分離を保ったまま、ベース指板の学習画面としても自然な見通しを作りやすい。

## これから改善したい点

現在の UI は方向性としては `muu-cardcraft` に寄り始めているが、画面幅ごとの安定性と情報量の整理はまだ途中である。

### レスポンシブの改善

- 1200px 前後の幅でも、中央カラムが横にはみ出さないようにする。
- タブレット幅では、フローティング panel の横幅、高さ、余白を専用に調整する。
- モバイル幅では、panel を無理に desktop レイアウトの縮小版にせず、drawer や bottom sheet 前提で見直す。

### サイドバーの改善

- モバイルでは、サイドバーの説明文を省略し、アイコンと短いラベル中心にする。
- `Modes` と `Panels` の役割の違いは残しつつ、幅が狭い時は情報量を減らす。
- デスクトップでは `icon + label + short description`、モバイルでは `icon + label` のように密度を切り替える。

### 補助パネルの改善

- `Controls` と `Progression` は、開いた時だけ表示する補助パネルとして整理する。
- desktop の panel は、中央領域の中で収まる幅と位置に調整する。
- panel の閉じるボタンは、右端固定で一貫した見た目にする。
- モバイルでは overlay が主役を隠しすぎないよう、位置とサイズを見直す。

### 画面の優先順位の改善

- 常設する主役は `Canvas` のみとし、他の情報は必要な時に開く方向へ寄せる。
- `ProgressionPanel`、`ProgressionEdit`、`Controls` は一度に常設しない。
- `BassFretboard` を中央の作業面として保ち、`Degree strip` はその付属情報として見せる。

### 実装順の目安

- まずモバイルでのサイドバー情報量を減らす。
- 次にモバイル / タブレットの panel 挙動を安定させる。
- そのあと `Progression Edit` を補助パネル化するか、別ページの役割を維持するかを決める。
- 最後に、上部ツールバーや mode bar を `muu-cardcraft` 風に追加する。

## 責務の分け方

### `app/page.tsx`

ホームの練習ページを担当する。

- `PracticeWorkspace` を表示する。
- Practice モードの入口として、指板と基本操作を見せる。

### `app/progression/page.tsx`

コード進行編集ページを担当する。

- `ProgressionEditorWorkspace` を表示する。
- 指板や再生パネルを置かず、進行編集を別ルートへ分離する。
- 2 / 4 / 8 / 16 bars を切り替えられるようにし、4 bars を基準に見通しを保つ。
- 8 / 16 bars は編集領域内スクロールで扱う。

### `app/components/PracticeWorkspace.tsx`

メインの練習・再生画面を担当する。

- 選択中の Root / Chord / Tuning / BPM などの state を持つ。
- `theory.json` から現在のコード種別やチューニングを選ぶ。
- `useMemo` で指板表示用データやコード構成音を作る。
- UI コンポーネントへ props とイベントハンドラを渡す。
- 音声 hook から受け取った再生関数を呼び出す。
- 進行再生中は、現在小節の Root / Chord を表示と再生へ反映する。
- `ProgressionQuickEditor` へ進行データと更新 callback を渡す。

ここには、大きな SVG 描画、音楽理論の細かい計算、AudioContext のライフサイクル、入力値の正規化ルールを置かない。画面の流れを読むためのファイルとして保つ。

### `app/components/AppShell.tsx`

アプリ全体の共通レイアウトとページナビゲーションを担当する。

- ダークテーマのサイドバーを表示する。
- `Practice` と `Progression Edit` の入口を常設する。
- サイドバーは `Modes` と `Panels` のように役割ごとに分けられるようにする。
- `Controls` のような補助パネルの入口をここに置けるようにする。
- `Progression Edit` は画面モード、`Quick Edit` はメイン画面の補助パネルとして分ける。
- モバイルではサイドバーを縮めて、ページ切り替えを残す。
- 転回形 (Inversion) のように比較したい選択肢は、ドロップダウンよりタブ型の方が向く。

このコンポーネントは、ページ固有の状態や音声再生は持たない。画面全体の導線だけをまとめる。

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
- `Harmony` と `Playback` のように意味のまとまりで面を分けて表示する。
- ガイドトーン強調の切り替えを表示する。
- Arpeggio / Chord / Metronome の操作を表示する。
- BPM 入力を表示する。
- Practice モードでは tempo 操作もここに置く。Progression モードでは進行再生側へ寄せる。

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

短期的なUI再構成の方針は [`docs/progression-editor-ui.md`](./progression-editor-ui.md) を参照する。

- 2 / 4 / 8 / 16 小節のループを編集する。
- 小節数の切り替えは、比較しやすいのでタブ型で見せる。
- 各小節を 2 拍単位で分割し、前半 / 後半の Root と Chord を選択できる。
- 状態の保存はしない。編集内容は親ワークスペースの state に反映するだけにする。
- `Progression Edit` ページでのみ表示する。

編集内容そのものは `ProgressionEditorWorkspace` の state に反映する。

### `app/components/ProgressionEditorWorkspace.tsx`

`/progression` の専用編集画面を担当する。

- 進行データを読み込み、`ProgressionEditor` へ渡す。
- 2 / 4 / 8 / 16小節の変更とセル編集をstateへ反映する。
- 指板、メトロノーム、進行再生の操作は持たない。
- 編集結果を `usePersistedProgression` でメイン画面と共有する。

### `app/components/ProgressionQuickEditor.tsx`

メイン画面で選択中の小節を素早く編集する。

- 前後の小節と2拍セルを切り替える。
- Root / Chordを即時変更する。
- `Full Editor` から `/progression` へ移動する。
- 小節数、拍、タイ、スラーなどの詳細編集は持たない。

### `app/components/ProgressionChordChart.tsx`

コード進行を簡易コード譜として表示する。

- 各小節のコード名と4拍のリズムスラッシュを表示する。
- 選択中の小節と拍を視覚的に示す。
- 拍の選択を callback で `ProgressionEditor` へ返す。
- 将来は休符、タイ、スラー、1拍コード上書きの表示を担当する。

このコンポーネントは編集データを更新せず、譜面表示と選択操作だけを担当する。

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
- 進行再生やアルペジオで使う、低い方のベース音を選ぶ。

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
