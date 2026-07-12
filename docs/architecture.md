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

指板 UI の次段デザイン参考は [`docs/fretboard-design-reference.md`](./fretboard-design-reference.md) にまとめる。

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

### Progressionの画面分離

コード進行は、メイン画面で再生し、`/progression` で詳細編集する。

- メイン画面は指板、同期再生、伴奏パターン、Quick Editを担当する。
- `/progression` はコード譜、小節、拍、タイ、スラーなどの編集を担当する。
- 両画面は `ProgressionSessionProvider` の進行データと編集履歴を共有する。
- Quick Editは選択中小節のRoot / Chord変更に限定する。
- TransportとAudio OutputはSessionのruntime Contextで共有する。
- 進行schedulerとメトロノームtimerは、再生UIを持つPractice側に置く。
- 編集画面には共有Transportを使うMini Transportを置き、Play / Stop / Resetと現在位置だけを提供する。
- 画面ごとにtimerや `AudioContext` を複製しない。

判断理由、トレードオフ、共有ストアへの移行条件は [`docs/progression-editor-ui.md`](./progression-editor-ui.md#設計判断-編集と再生を分離する) を参照する。

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

### `app/scales/page.tsx`

12キーのスケール譜面ページを担当する。

- `ScaleSheet` を表示する。
- スケール種別を切り替え、全ルートの譜面を一覧できるようにする。
- PDF保存はブラウザ印刷に任せ、ページ側では印刷に適したレイアウトを用意する。
- 楽譜描画はVexFlowを使い、自前SVGで音符位置や臨時記号を管理しない。
- スケール定義の追加方針は [`docs/music-theory.md`](./music-theory.md#スケール譜面の拡張方針) にまとめる。

### `app/components/scales/ScaleSheet.tsx`

スケール譜面ページの状態と一覧表示を担当する。

- 選択中のスケールIDを持つ。
- `data/theory.json` の12ルートから、各キーのスケール音を作る。
- `ScaleStaff` へ、ルート、スケール名、音列を渡す。
- PDFボタンから `window.print()` を呼び出す。

### `app/components/scales/ScaleStaff.tsx`

1キー分の五線譜表示を担当する。

- VexFlowのSVGレンダラーでヘ音記号の譜面を描画する。
- 音符、臨時記号、譜表、小節内レイアウトはVexFlowに任せる。
- 音名と度数の補助ラベルは、譜面下のHTMLリストとして表示する。
- スケール音の計算は行わず、渡された `ScaleNote[]` を描画するだけにする。

#### スケール譜面レイアウトの調整方針

スケール譜面では、音名や度数ラベルよりも五線譜側の見切れ、詰まり、上下の重心のズレが視覚的な違和感になりやすい。CSSで描画済みSVGを単純に縮小するだけでは、調号が多いキーや高音域のキーで安定しないため、VexFlowへ渡すレイアウト値を画面幅ごとに調整する。

基本方針:

- `desktop`, `tablet`, `mobile` のように複数の `notationLayouts` を持つ。
- 各レイアウトで `width`, `height`, `staveX`, `staveY`, `staveWidth`, `formatWidth` を調整する。
- 375px / 425px 幅でも音符、調号、五線、音名、度数がカード内で見切れないことを基準にする。
- 調号が多いキーでは、左側の密度と右端の音符見切れを優先して確認する。
- 音域が上へ寄るキーでは、譜表の上下位置とカード内の縦余白を優先して確認する。
- 音名と度数ラベルはVexFlowの音符X座標へ追従させ、HTML側の均等グリッドだけで位置決めしない。
- `All` 表示は後から別途詰める。まずは `C-E` / `F-B` の1列表示で自然に見えることを優先する。
- PDF印刷用のレイアウトは、画面用レイアウトが安定してから調整する。

個別補正の方針:

- まずは共通の密度判定で、調号または臨時記号の数に応じて `noteScale`, `accidentalScale`, `noteShift`, `formatWidth` を調整する。
- 共通ルールだけで画面内に入りきらないスケールは、`scaleId`, `root`, `viewport` をキーにした個別補正を持てるようにする。
- 個別補正で扱う値は、音符全体の縮小率、臨時記号の縮小率、譜表のY位置、譜面高さ、音符のX方向シフト、ラベルの上余白に限定する。
- 補正は表示上の読みやすさのためだけに使い、`ScaleNote[]` の音名、度数、MIDI番号は変更しない。
- 例外補正が必要な候補は、Mixolydian / Locrian など臨時記号が多いモード、E / F / F# / Ab など上下どちらかに寄りやすいルートから優先して確認する。
- A♭ Locrianのように完成度が高い配置は、見切れ回避ではなく完成形の保存として個別補正を残してよい。
- 補正値はCSSだけに閉じ込めず、VexFlow描画前後のレイアウト計算に寄せる。HTMLラベルは描画後の音符X座標へ追従させる。
- 将来的に補正対象が増えたら、`ScaleStaff` 内の配列ではなく `app/lib/scales.ts` か専用のレイアウト設定モジュールへ分離する。
- 個別補正の履歴は [`docs/scale-staff-adjustments.md`](./scale-staff-adjustments.md) に1件ずつ残す。

確認する幅の目安:

- `375px`: 狭いモバイル幅。最優先で見切れを避ける。
- `425px`: 標準的なモバイル幅。カード内の余白と譜面密度のバランスを見る。
- `768px`: タブレット幅。1列と2列の切り替えが破綻しないかを見る。
- `desktop`: `All` の2列表示で調号が多いキーも読めるかを見る。

### `app/lib/scales.ts`

スケール定義とスケール音生成を担当する。

- スケールごとの `degree` / `semitones` を定義する。
- ルート音とスケール定義から、譜面表示用の `ScaleNote[]` を作る。
- 音名の綴りは `app/lib/music.ts` の `spellIntervalNote` を使う。

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

### `app/hooks/useAudioOutput.ts`

AudioContextと音源出力を担当する。

- `AudioContext` をユーザー操作後に必要になったタイミングで作る。
- ベース音、ピアノ音、メトロノームクリックを `app/lib/audio.ts` へ委譲する。
- 出力先には共有のマスター段を挟み、軽いコンプレッションでピークを整える。
- AudioContextの再開操作を提供する。

拍位置やコード進行は参照せず、指定された音を鳴らすことだけを担当する。

### `app/hooks/useMetronome.ts`

メトロノームのtimerと表示状態を担当する。

- 開始 / 停止、現在拍、現在pulse、count-inを管理する。
- BPM、pulse、swingから次のtickまでの時間を決める。
- 発音は注入された `playClick` へ委譲する。
- Count-in完了時の最初の再生拍をcallbackで通知する。

AudioContextを直接所有しないため、将来Sessionの音声出力と同じContextを共有できる。

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
- `planProgressionBeat` が返した予定音をAudio Outputへ渡す。

この hook は、実際の音色合成や `AudioContext` の管理はしない。進行伴奏のパターン解釈も純粋なplannerへ委譲する。

### `app/hooks/useProgressionPlayback.ts`

Transportの経過時間をコード進行上の位置へ変換する。

- `useTransport` から経過秒数と再生状態を受け取る。
- `app/lib/progression.ts` の純粋関数を使って、現在の拍・16分step位置と選択中のセルを 1 回で求める。

この hook は、進行データそのものの編集はしない。入力された進行を時間に同期させる役割に絞る。

### `app/hooks/useProgressionBeatScheduler.ts`

Transportの16分step位置を、進行伴奏の発音要求へつなぐ。

- 再生中に16分stepが切り替わったことを検出する。
- 現在stepにRhythmイベントがある場合だけ発音要求を作る。
- 同じstepで発音要求が重複しないようにする。
- 次の実効拍からRootを求め、1拍overrideも伴奏へ反映する。
- 現在拍、音価、次Root、伴奏パターンを `useChordPlayback` へ渡す。

MIDI番号の選択やWeb Audio APIの操作は持たない。1拍内に複数Hitがある場合、次拍のTieはその拍で最後に置かれたHitを延長する。

### `app/hooks/useProgressionStepScheduler.ts`

Transportの16分step位置が切り替わったことを一度だけ通知する。

- 再生開始時と各`stepIndex`の変化を検出する。
- 同じstepでcallbackが重複しないようにする。
- 停止時に直前stepを破棄し、再開位置をもう一度通知できるようにする。

step schedulerは各16分位置を通知し、進行schedulerはその位置にRhythmイベントがある場合だけ発音する。拍頭にイベントがない既存データは、互換規則により4分音符のHitとして扱う。

### `app/hooks/useTransport.ts`

再生対象に依存しないTransportの時計を担当する。

- 再生の開始 / 停止 / 再開 / リセットを扱う。
- `requestAnimationFrame` で経過秒数を更新する。
- コード進行、拍子、発音内容は参照しない。

進行位置の計算や音声スケジューリングをここへ入れず、時間管理だけを共有できる形に保つ。

### `app/hooks/useProgressionState.ts`

メイン画面とFull Editorで共通する進行stateと更新規則を担当する。

- 既定のコード進行を初期化する。
- BPMを進行データへ同期する。
- 2拍セルの更新処理を一元化する。
- 小節数変更を一元化する。
- 1拍単位のHit / Rest / Tieと音価変更を一元化する。
- 任意の16分stepに置くHit / Restの追加・更新・削除を一元化する。
- 進行編集のUndo / Redo履歴を最大100件保持する。
- `usePersistedProgression` を通じて保存と読み込みを行う。

画面コンポーネントは `setProgression` を直接扱わず、`updateCell` や `updateBarCount` を呼ぶ。Root / Chordと小節数の変更は履歴対象にするが、BPM同期と保存データの読み込みは履歴へ積まない。将来の拍、タイ、スラー更新もこのhookへ追加し、画面ごとに更新規則を複製しない。

### `app/lib/progression/history.ts`

進行編集のUndo / Redo履歴を純粋なreducerとして管理する。

- commit時に現在値をpastへ積み、futureを破棄する。
- Undo / Redo時も、現在のBPMは維持する。
- hydrateとBPM同期は編集履歴へ積まない。

Reactには依存せず、`useProgressionState` と単体テストの両方から利用する。

### `app/providers/ProgressionSessionProvider.tsx`

PracticeとFull Editorで共有する進行Sessionの境界を担当する。

- `useProgressionState` をレイアウト階層で一度だけ生成する。
- canonicalな進行データ、更新command、Undo / Redo履歴を両画面へ提供する。
- PracticeのBPMを `syncBpm` で進行データへ同期する。
- `useProgressionPlayback` と `useAudioOutput` をruntime Contextとして提供する。
- データContextとTransport Contextを分け、再生フレームでFull Editor全体を再レンダーしない。

PracticeとFull Editorは同じTransportとAudio Outputを共有する。Full Editorのschedulerは`ProgressionMiniTransport`へ隔離し、再生フレームでEditor本体を再レンダーしない。Full Editorでは確認用のRoot Only伴奏だけを提供し、BPMや伴奏パターンなどの詳細設定はPractice側に残す。

Straight / Shuffleは保存Rhythmイベントを変更しないRuntime設定として共有する。論理上の1拍4stepは維持し、schedulerが各stepをStraightの`0, 1/4, 1/2, 3/4`またはShuffleの`0, 1/3, 2/3, 5/6`拍へ写して発音時刻と音価を求める。三連符の譜面入力とは分離する。

### `app/hooks/usePersistedProgression.ts`

コード進行の編集内容をブラウザ保存する。

- 進行の拍子と小節データを `localStorage` へ保存する。
- 保存値が壊れている場合や、Root / Chord が現在の候補にない場合は無視する。
- 読み込み時は既存 state の BPM を保ったまま、進行データだけ復元する。
- v8では付点4分の6step音価を保存する。v7のRhythmイベントはそのまま読み込む。
- v7からHarmonyの拍上書きとRhythmイベントを分けて保存する。
- v2-v6の拍内に保存されたHit / Rest / Tieと音価は、読み込み時に16分step上のRhythmイベントへ移行する。
- 旧データの音価未指定拍は4分音符、イベント未指定拍はHitとして読み込む。

### DB に持つもの

DB は「再利用したい音楽データの正本」を持ち、UI の一時状態や再生中の瞬間値は持たない方針にする。

DB に置く候補:

- ユーザー情報
- 曲、練習課題、進行テンプレートなどの作品単位データ
- 進行の canonical data
  - `timeSignature`
  - bars
  - cells / beats / rhythm / tickRhythm
  - 保存対象にしたい BPM や groove などの設定
- 進行のバージョン履歴
  - 保存時刻
  - 作成元
  - 変更理由やタグ
- 演奏の記録メタデータ
  - いつ演奏したか
  - どの進行を再生したか
  - BPM / groove / rhythm preset などの条件
- 録音や書き出しの参照情報
  - 音声ファイル
  - MIDI ファイル
  - 生成済みの書き出し物
- お気に入り、タグ、検索用メタデータ

DB に直接入れないもの:

- 再生位置、選択中の拍、小節カードのハイライトなどの一時 UI state
- `requestAnimationFrame` や `AudioContext` に依存する runtime state
- 再生音そのもののバッファ

音声ファイルや MIDI のような大きいバイナリは、DB ではなくファイルストレージやオブジェクトストレージに置き、DB には参照とメタデータだけを持たせる。これにより、検索・履歴・共有・再生成の入口を DB に寄せつつ、重い実体は別管理にできる。

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

### `app/lib/progression/`

コード進行ドメインの純粋関数を、責務ごとのモジュールへ分けて管理する。`index.ts` は既存利用側へ互換APIを公開する入口とし、実装規則は置かない。

- `model.ts`: 保存データ型、定数、既定進行。
- `harmony.ts`: 2拍セル継承と1拍コード上書き。
- `structure.ts`: 小節数変更と既存パターンの複製。
- `timeline.ts`: BPM、拍子、経過秒数から拍・小節・16分step位置への変換。
- `rhythm/queries.ts`: 明示イベントと既定4分音符を合成したRhythm照会。
- `rhythm/presets.ts`: Preset ID、表示名、対象拍数、timing grid、相対イベント配置のカタログ。
- `rhythm/commands.ts`: Hit / Rest / Tie、音価、プリセットの編集command。
- `rhythm/collision.ts`: イベント配置と音価の衝突判定。
- `rhythm/boundary.ts`: 小節跨ぎ付点4分と自動Tieの整合性。
- `rhythm/store.ts`: 明示Rhythmイベント配列の低レベル更新。
- `rhythm/ties.ts`: Tie可否と後続Tie数の照会。
- `rhythm/timeline.ts`: 実小節を仮想2周へ展開した絶対step占有と配置衝突理由。
- `scheduler.ts`: schedulerへ渡すstep単位の再生要求生成。
- `persistence.ts` / `migration.ts`: 保存値のvalidationと旧形式migration。
- `history.ts`: Undo / Redoの純粋reducer。

これらのモジュールは、再生中の時間管理や UI 更新を持たない。`requestAnimationFrame` や `AudioContext.currentTime` から得た値を受け取り、位置情報に変換する。

4/4では1拍を4step、1小節を16stepとして扱う。Full Editorは選択中の拍を`1 / e / & / a`へ展開し、任意stepのHit / Restを編集できる。schedulerは各stepの明示イベントを発音し、小節カードは拍の主記号と4stepの補助レーンを重ねて表示する。Harmonyデータへタイミング情報は戻さない。

Rhythm Presetは`rhythm/presets.ts`の純粋データを定義元とし、判定・配置command・UIが同じカタログを参照する。Presetイベントは`startUnit`と`durationUnits`を持ち、`timingGrid`が1拍内のunit数を決める。既存4種類は`sixteenth` gridを使い、command適用時に従来の16分stepへ変換する。

`rhythm/timing-grid.ts`は1拍を12tickとして扱う。16分gridは3tick刻み、Triplet gridは4tick刻みになり、両者を丸めず同じ時間軸へ置ける。保存形式v8とschedulerは引き続き1拍4stepのため、Triplet gridのPresetを16分stepへ暗黙変換しない。Tripletの保存・編集・再生を接続する段階で、12tickイベント形式とmigrationを別途設計する。

仮想タイムラインは同じ実小節列を判定時だけ2周へ展開する。先行イベントの占有範囲を優先し、占有中のstepや後続イベントへ重なる音価には純粋関数から衝突理由を返す。仮想2周目は`localStorage`、Undo / Redo履歴、Editorの編集対象へ含めない。

### `app/lib/progression/playback.ts`

進行伴奏の1拍分を、再生予定音の配列へ変換する。

- Root Only、Chord Tones、度数フロー、4 Beatのパターンを解釈する。
- 各音のMIDI番号、拍内の開始offset、長さを決める。
- 4 Beatでは次の実効拍のRootへ向かうアプローチ音を選ぶ。
- Rest拍では再生予定音を返さない。
- Tie拍では再発音せず、直前のHitが生成する最後の予定音をTie拍数ぶん延長する。
- Hitの1 / 2 / 3 / 4 / 6step音価に収まる予定音だけを残し、最後の音を音価終端まで伸ばす。

React、Transport、AudioContextには依存しない。付点を含む音価は16分音符単位のstepとdurationから秒数へ変換し、リズムスラッシュの表示と再生で同じデータを参照する。

将来は小節末だけでなく、Beat 2からBeat 3など小節内のコード境界も検出し、切り替え直前の拍から次Rootへ自然につなぐアプローチを選べるようにする。常に半音下へ固定せず、半音上、コードトーン経由、アプローチなしを再生パターンとして選択できる設計を検討する。

### `app/lib/audio.ts`

音声合成と再生を担当する。

- ベース音を鳴らす。
- ベース音は実録 `E1 / A1 / D2 / G2` サンプルから再生MIDIに最も近い音源を選び、読み込めない場合は生成サンプルへ戻す。
- 録音ごとの音程差は `baseFrequency` で微調整する。
- ピアノ風のコード音もサンプルベースで鳴らし、薄い残響を足している。
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
