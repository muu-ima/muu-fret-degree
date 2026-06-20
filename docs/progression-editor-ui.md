# Progression Editor UI 短期改善指針

この文書は、Progression Editor をフォーム入力型 UI からエディター型 UI へ移行するための短期的な設計指針である。実装と検証を進めながら更新し、操作モデルが固まった段階で正式な仕様へ統合する。

## 目的

現在の Progression Editor は、Root と Chord の select が小節ごとに並ぶため、コード進行を編集する画面というより設定画面に見えやすい。

次の体験を目標にする。

- コード進行の全体像を一覧できる。
- `2拍セル×2` の大枠を保ちながら、1拍単位で編集できる。
- Root と Chord を少ない操作で変更できる。
- 小節カード自体が簡易コード譜として読める。
- モバイルでも横スクロールに依存しない。
- スラッシュコード、リズムスラッシュ、休符、タイ、スラーを追加できる。

## 現行モデルとの関係

現在は、1小節を `Beats 1-2` と `Beats 3-4` の2セルに分けている。

```ts
type ProgressionCell = {
  root: string;
  chordTypeId: string;
};

type ProgressionBeat = {
  chordOverride?: ProgressionCell;
};

type ProgressionRhythmEvent = {
  startStep: number;
  durationSteps: 1 | 2 | 3 | 4;
  eventType: "hit" | "rest" | "tie";
};

type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
  beats?: readonly [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
  rhythm?: readonly ProgressionRhythmEvent[];
};
```

`cells` はコード進行の大枠として維持する。各セルは2拍分の既定コードを持ち、その内側に4拍の編集レーンを重ねる。

- Beat 1-2は `cells[0]` を継承する。
- Beat 3-4は `cells[1]` を継承する。
- 1拍だけコードを変える場合は、その拍にコード上書きを持たせる。
- 拍データがない既存進行は、4拍すべて発音する既定値として読み込む。
- Harmonyの拍上書きは`beats`、発音位置と音価は`rhythm`へ分けて保存する。
- 拍頭にRhythmイベントがない場合は4分音符の`hit`とし、既定値と異なるイベントだけを明示的に保存する。

現在は拍頭から始まる1/16、1/8、付点1/8、1/4と、1拍単位のHit / Rest / Tieまで実装済み。付点4分は次拍の途中まで跨ぐため、任意stepからイベントを開始できる段階で追加する。

Tieは直前に有効なHitがある場合だけ選択できる。Tie元のHitをRestへ変更した場合は、音のないTieを残さないため、連続する後続TieもRestへ変更する。

## 画面の役割

- `/progression`: コード譜、小節、拍、タイ、スラーを扱うFull Editor。
- メイン画面の `Quick Edit`: 選択中小節のRoot / Chordだけを変更する補助パネル。
- メイン画面の `Progression`: 同期再生と伴奏パターンを操作するパネル。

編集機能をFull Editorへ、再生機能をメイン画面へ分ける。両画面は同じ進行保存データを使用する。

## 設計判断: 編集と再生を分離する

### 判断

Progression Editをメイン画面へ重ね続けず、`/progression` を独立した編集ワークスペースにする。メイン画面にはProgression再生とQuick Editだけを残す。

### 理由

- 指板を見ながら練習する作業と、コード譜全体を組み立てる作業では必要な画面密度が異なる。
- タイ、スラー、休符、拍編集、Undoをフローティングパネルへ追加すると、指板が隠れ、モバイルのbottom sheetも過密になる。
- コード譜は横幅と一覧性が重要なため、専用画面の主役として扱う方が自然である。
- 再生装置をメイン画面へ集約すると、指板、現在コード、伴奏パターンを同時に確認できる。
- Quick Editを残すことで、練習中の小さな修正のために毎回画面移動する必要がない。

### 境界

メイン画面が担当するもの:

- Bass Fretboard
- コード進行の同期再生
- Root Only、度数フロー、4 Beatなどの伴奏選択
- 選択中小節のRoot / Chordを変更するQuick Edit

Full Editorが担当するもの:

- コード譜の全体表示
- 小節、2拍セル、1拍の選択と編集
- 休符、タイ、スラー、スラッシュコード
- 将来のコピー、貼り付け、Undo / Redo

Quick Editには、小節数変更、拍編集、タイ、スラーなどを追加しない。Quick Editが再びFull Editor化しないよう、役割を限定する。

Full EditorのUndo / Redoは `useProgressionState` が担当する。

- Root / Chordと小節数の変更を履歴へ積む。
- 選択中の小節・拍、再生位置、パネル状態、BPM同期は履歴対象にしない。
- 新しい編集を行った場合はRedo履歴を破棄する。
- 履歴は最大100件とし、永続化するのは現在の進行だけにする。
- デスクトップはEditorヘッダー、モバイルは専用ボトムバーに操作を置く。
- `Ctrl/Cmd + Z` でUndo、`Ctrl/Cmd + Shift + Z` または `Ctrl/Cmd + Y` でRedoする。

### 分離は再生からの孤立を意味しない

Full Editorでも、編集内容と再生位置の関係を確認できるようにする。

- コード譜上で現在再生中の小節と拍をハイライトする。
- Full EditorにはPlay / Stopと現在位置だけのMini Transportを置く。
- 選択中コードを単体で試聴できるようにする。
- 編集中の変更は、原則として次の拍または次のスケジュール単位から再生へ反映する。
- 再生中の小節が表示範囲外へ移動した場合は、ユーザー操作を妨げない範囲で追従表示する。

BPM、伴奏パターン、メトロノームなどの詳細設定はメイン画面に残す。Full Editorへ同じ再生パネルを複製せず、編集確認に必要な最小操作だけを公開する。

画面ごとに別のtimerや `AudioContext` を作らない。進行データ、Transport、Audio Outputはレイアウト階層の単一Sessionで共有し、メトロノームtimerと進行schedulerは利用する画面側から接続する。

目標となる責務:

```text
Progression Session
├─ canonical progression data
├─ playback position
├─ transport commands
└─ persistence

Practice              Full Editor
├─ full playback UI   ├─ chord chart playhead
├─ fretboard sync     ├─ mini transport
└─ quick edit         └─ detailed editing
```

これにより、画面の役割は分けたまま「編集しながら聴く」「再生位置を見ながら直す」体験を保つ。

### 状態共有

現在は `ProgressionSessionProvider` を共有境界にする。進行の初期化、セル更新、小節数変更、永続化、Undo / Redo履歴は `useProgressionState` に集約し、PracticeとFull Editorは同じSessionと更新commandを利用する。

- ルート遷移を挟んでも進行データと編集履歴を維持する。
- Full EditorとQuick Editの変更を同じcanonical dataへ即時反映する。
- `usePersistedProgression` はSession内で一度だけ実行する。
- TransportとAudio Outputは専用runtime Contextで共有する。
- メトロノーム状態、進行scheduler、パネルの開閉状態はPractice側に置く。

複数タブや複数端末での同期は対象外とし、必要になった時点で `storage` eventや外部ストアを検討する。

### 見直し条件

次の要件が生じた場合は、現在のReact Contextを外部ストア、または `useSyncExternalStore` を使った進行専用ストアへ発展させる。

- 複数コンポーネントが同時に進行を頻繁に更新する。
- 画面遷移なしでFull Editorと再生画面を同時表示する。
- 複数タブや複数端末で編集内容を即時同期する。
- 再生位置を購読するコンポーネントが増え、Context更新が性能上の問題になる。

Mini Transportとコード譜のplayhead同期へ進む段階で、Full Editorから共有Transportを購読する。現段階ではPracticeを離れるとTransportを停止し、見えない再生を残さない。

### トレードオフ

- Full Editorへ移動する操作が1段増える。
- Session Context更新時の再レンダー範囲に注意する必要がある。
- Mini Transport追加時は、再生中の編集反映タイミングを明確にする必要がある。

これらは、メイン画面の視認性と編集画面の拡張性を得るために受け入れる。

## Phase 1: コード進行エディター

### 画面構成

モバイルでは譜面を縮小再現せず、次の2領域に分ける。

1. 上部: コード譜形式の小節グリッド
2. 下部: 選択中の小節・拍エディター

全小節を同時に編集せず、一覧と詳細編集の役割を分離する。

### 小節グリッド

小節を2列のカードで表示する。カード内にはコード名だけでなく、4拍のリズムスラッシュも表示する。

```text
 BAR 1              BAR 2
 Cmaj7      Am7     Dm7       G7
|  /   /  |  /  / ||  /   /  |  /  / |
```

コード名は適用開始拍の上に表示する。1拍だけコードを上書きした場合も、その拍の上にコード名を表示する。

```text
 Cmaj7  F7  Am7
|  /    / |  /   / |
   1    2    3   4
```

要件:

- モバイルは2列グリッドを基本とする。
- 小節番号を常に表示する。
- コード記号をカード内で最も強い文字として表示する。
- 4拍の境界が分かるコード譜UIをカード内に表示する。
- 小節カードのタップで小節を選択し、拍のタップで編集拍を選択する。
- 選択中の小節を枠、背景、アクセント色で強調する。
- 選択中の拍も色以外のインジケーターで示す。
- 8 / 16小節でもグリッド領域内の縦スクロールで全体を把握できる。
- コード記号は `Cmaj7`、`Am7` など、短く判別しやすい表記にする。
- タイとスラーは拍をまたぐ線または弧として表示する。

### 選択中の小節・拍

小節を選択した後、4つの拍から編集対象を選ぶ。2拍セルは拍のグループとして残し、コードの継承元を示す。

```text
BAR 1
[BEATS 1-2] [BEATS 3-4]
[BEAT 1] [BEAT 2] [BEAT 3] [BEAT 4]

Cmaj7
```

要件:

- 初回は `Beat 1` を選択する。
- 2拍セルと4拍の対応関係を視覚的に示す。
- 拍切り替えは4分割の segmented button またはコード譜上の拍を直接タップして行う。
- 選択中のコード名を大きく表示する。
- コード編集は `2拍セルへ適用` と `選択拍だけ上書き` を選べるようにする。
- 発音、休符、タイ、スラーを選択拍ごとに編集する。
- 2拍セルへの変更は既存の `onCellChange` から即時反映する。
- 小節グリッドの表示も同時に更新する。

### 拍入力

選択した拍に対して、次を編集する。

- `Hit`: 拍頭で発音する。
- `Rest`: 発音しない。
- `Tie`: 前の音を切らず、この拍まで伸ばす。
- `Slur`: 前の音から異なる音へ滑らかにつなぐ。

タイは同じ音高の持続、スラーは異なる音高間のレガートとして区別する。表示が似ていても、保存データと再生処理では別の値にする。

### Root 入力

select ではなくチップボタンを使う。

```text
C  C#  D  Eb  E  F
F# G   Ab A   Bb B
```

要件:

- `data/theory.json` の Root 配列を使用する。
- 2行程度に収まるグリッドを優先する。
- 選択中のRootを明確に強調する。
- 各ボタンは十分なタップ領域を持つ。

### Chord 入力

Chord Type もチップボタンで表示する。

```text
Maj7  m7  7  m7b5  dim7
Maj   Min sus4  6    m6
```

要件:

- 内部値には既存の `chordTypeId` を使用する。
- 表示名だけを短縮し、音楽データは変更しない。
- 選択中のChord Typeを視覚的に強調する。
- 選択肢が増えた場合も、まず折り返しで対応する。
- モバイルで常時スクロールが必要になる場合のみ、補助メニューへの分離を検討する。

### デスクトップ

デスクトップでは小節を横方向へ4小節程度並べ、コード譜として連続して読める表示にする。モバイルと選択状態・編集データは共通化する。

```text
| Cmaj7  / / | Am7  / / | Dm7  / / | G7  / / |
```

編集操作は詳細エディターへ集約し、デスクトップのコード譜を複雑な直接入力UIにしすぎない。

## Phase 2: 拍データとコード表記

小節グリッドとチップ入力を先に安定させた後、4拍レーンを保存・再生へ接続する。

対象:

- スラッシュコードとベース音指定
- 発音と休符
- 音価（4分、8分、付点4分、付点8分など）
- タイ
- スラー
- リズムスラッシュ表示

```text
BAR 1  Cmaj7/E

1       2       3       4
■       ━       ■       □
```

記号:

- `■`: 発音
- `□`: 休符
- `━`: 次のステップへのタイ
- 弧線: 次の音へのスラー

データ構造の候補:

```ts
type ProgressionCell = {
  root: string;
  chordTypeId: string;
  bassPitchClass?: string;
};

type RhythmEvent = {
  startStep: number;
  durationSteps: number;
  eventType: "hit" | "rest" | "tie";
};

type ProgressionBar = {
  bar: number;
  cells: readonly [ProgressionCell, ProgressionCell];
  beats?: readonly [ProgressionBeat, ProgressionBeat, ProgressionBeat, ProgressionBeat];
  rhythm?: RhythmEvent[];
};
```

`RhythmEvent` は1小節を16分音符単位の16stepとして扱う。現行の`durationSteps`は4分音符を`4`、8分音符を`2`、付点8分音符を`3`として表現する。付点4分音符の`6`は任意step配置とイベント重複規則を実装するときに型へ追加する。Tieは現段階では独立イベントとして保存し、直前のHitを再発音せず延長する。

Transportの`ProgressionPosition`は累積`stepIndex`、拍内`stepInBeat`、小節内`stepInBar`を持つ。既存の拍再生を維持したまま、このstep位置を細かなリズムイベントの発火基準へ段階的に接続する。

コード譜では `hit` を音価に応じたリズムスラッシュで描画し、付点はスラッシュの右側へ表示する。タイは隣接するスラッシュを弧で結ぶ。最初は1拍単位のHit / Rest / Tieを実装し、その後16分stepへ拡張して付点と細かなリズムを扱う。

`beats` はHarmonyだけを扱う。値がない場合は、各拍が所属する2拍セルのコードを継承する。Rhythmは`rhythm`へ集約し、保存形式v2-v6の拍内リズム情報はv7読み込み時に移行する。

16分音符単位の編集は`RhythmEvent.startStep`を使って段階的に追加する。最初から16ステップを常時表示せず、選択中の拍だけを4分割するなど、画面密度を保ちながら編集粒度を切り替える。

## モバイル方針

- 全小節を同時編集しない。
- 横スクロール前提の譜面UIを作らない。
- 五線譜ベースの入力UIを作らない。
- 小節グリッドと詳細エディターの縦方向の流れを保つ。
- bottom sheet内では、グリッドと編集領域のどちらをスクロールさせるかを明確にする。
- 375px幅でコード名、4拍レーン、チップが窮屈にならないことを確認する。

## アクセシビリティ

- 小節カードとチップは `button` を使用する。
- 選択状態を `aria-pressed` または適切なtab属性で伝える。
- 色だけで選択状態を示さない。
- キーボード操作でも小節、拍、Root、Chordを選択できるようにする。
- コード記号の視覚表記とは別に、読み上げ用のコード名を保持する。

## 短期改善の完了条件

- 2 / 4 / 8 / 16小節を小節カードで一覧できる。
- 各カードが4拍のコード譜として読める。
- 小節、2拍セル、1拍を選択できる。
- Root と Chord をチップで変更できる。
- 1拍だけコードを上書きできる。
- 発音、休符、タイ、スラーを1拍単位で設定できる。
- 変更が再生、指板、保存データへ即時反映される。
- 既存の進行データを移行なしで読み込める。
- 375px前後とデスクトップの双方で操作できる。
- `npm run build` が成功する。

## 実装順

1. `ProgressionEditor` に選択中の小節・セル・拍を表すローカルUI状態を追加する。
2. 現在の編集フォームをコード譜形式の小節グリッドと詳細エディターへ分離する。
3. Root selectをチップへ置き換える。
4. Chord selectをチップへ置き換える。
5. 4拍レーンと拍選択UIを追加する。
6. 任意の `beats` データを追加し、発音・休符・タイを保存と再生へ接続する。
7. スラーと1拍コード上書きを追加する。
8. モバイルとデスクトップのコード譜レイアウトを調整する。

## 対象外

この短期改善では次を実装しない。

- ドラッグによる小節並べ替え
- 小節のコピー・貼り付け
- Undo / Redo
- 五線譜表示
- 16分音符の常時一括編集
- 複雑な反復記号やコーダなどの譜面記号

これらは1拍単位のコード譜編集が安定してから追加する。
