# Bass Chord Degree User Guide

Bass Chord Degree は、コード構成音をベース指板上の度数で確認し、コード再生、メトロノーム、コード進行ループを使って練習するアプリです。

## 画面構成

### Practice

通常の練習画面です。中央の Bass Fretboard を見ながら、コード、音域、チューニングを切り替えます。

### Panels

サイドバーまたはモバイル下部のメニューから補助パネルを開きます。

- `Controls`: コード、チューニング、転回形、ガイドトーン、コード再生
- `Metronome`: テンポ、Pulse、拍子、音色、Count-in、Swing
- `Progression`: コード進行の再生、リズム伴奏
- `Progression Edit`: コード進行の編集

デスクトップでは中央にパネルが開きます。モバイルでは bottom sheet として開き、上部ハンドルをドラッグして高さを調整できます。

## Bass Fretboard

指板上の丸は、選択中コードの構成音です。

- 丸の中央: コード内の度数
- 丸の下: 音名
- 赤い `1`: Root
- 青系: 3rd
- 黄系: 5th
- 紫系: 7th など

ノートをクリックまたはキーボードで選択すると、対応するベース音を再生します。

`0-12F` と `13-22F` で表示範囲を切り替えられます。

## Controls

### Harmony

- `Root`: ルート音
- `Chord`: コードタイプ
- `Tuning`: ベースチューニング
- `Octave`: コード再生の基準音域
- `Inversion`: 転回形
- `3rd / 7th を強調`: ガイドトーン表示

### Playback

- `Arpeggio`: コード構成音を順番に再生
- `Chord`: ピアノ風の積み音でコードを再生

## Metronome

### Tempo

BPM は `40-240` の範囲で設定できます。

- `- / +`: 1 BPMずつ変更
- `Tap Tempo`: 繰り返しタップしてBPMを計測
- `Tempo Presets`: 60から160 BPMまでの代表値を選択

### Tone

- `Soft`: 丸く優しい音
- `Wood`: 短く乾いた音
- `Classic`: はっきりした電子クリック

### Pulse

- `1/4`: 4分音符
- `1/8`: 8分音符
- `Triplet`: 3連符
- `1/16`: 16分音符

### Swing

8分音符のPulseでのみ使用できます。

- `Straight`: 均等
- `Light`: 軽いスウィング
- `Medium`: 中程度
- `Heavy`: 深いスウィング

### Count-in

- `Off`: カウントなし
- `1 bar`: 1小節カウントして開始
- `2 bars`: 2小節カウントして開始

Count-in中は上部表示がアンバー色に変わり、残り拍数を表示します。

### Keyboard

メトロノームパネルを開いている間だけ有効です。

| キー | 操作 |
| --- | --- |
| `Space` | Start / Stop |
| `T` | Tap Tempo |
| `↑ / ↓` | BPMを1変更 |
| `Shift + ↑ / ↓` | BPMを5変更 |

## Progression

コード進行をBPMに同期してループ再生します。

- `Play`: 現在位置から再生
- `Stop`: 停止
- `Reset`: 先頭へ戻す

### Rhythm

- `Chord Tones`: コード構成音を拍ごとに再生
- `4 Beat`: ジャズの4ビート風ウォーキングベース

`4 Beat` は、各2拍セルを Root と5thで進み、小節の4拍目では次の小節のRootへ半音下からアプローチします。

## Progression Edit

1小節を `Beats 1-2` と `Beats 3-4` の2セルに分け、RootとChordを設定します。

- `2 bars`
- `4 bars`
- `8 bars`
- `16 bars`

編集内容と主要な練習設定はブラウザの `localStorage` に保存されます。

## Troubleshooting

### 音が鳴らない

ブラウザはユーザー操作前の音声再生を制限します。画面内の再生ボタンや指板ノートを一度押してください。

### Fast Refresh の useEffect エラー

開発中に音声設定を変更すると、Fast Refresh が変更前の依存配列を保持する場合があります。`Ctrl + Shift + R` で完全リロードするか、開発サーバーを再起動してください。

### 開発サーバー

```bash
npm install
npm run dev
```

通常は `http://localhost:3000` で開きます。
