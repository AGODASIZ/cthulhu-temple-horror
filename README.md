# 深淵神殿(仮) - Prototype

クトゥルフ神話モチーフの3D一人称探索・脱出ホラーゲームのプロトタイプ。
GDDは `GDD.md` を参照(GDD.mdはこのフォルダに一緒にコピーして使ってください)。

## Cursorでのセットアップ手順

1. このフォルダ一式をCursorで開く(File > Open Folder)
2. ターミナルを開いて依存関係をインストール
   ```bash
   npm install
   ```
3. 開発サーバーを起動
   ```bash
   npm run dev
   ```
4. ターミナルに表示されるURL(通常 http://localhost:5173)をブラウザで開く

## 現状の実装(プレイ可能プロトタイプ)

- マップ: ①入口 → ②分岐回廊 → ③水没大聖堂 → ④書庫 / ⑤生贄の間 → ⑦祭壇
- 印(鍵)3つを集め、祭壇に捧げ、入口へ逃げてクリア
- 守護者AI: 徘徊 → 索敵 → 追跡 → 見失い (FSM)
- しゃがみ・ライト消灯・柱の陰で発見率低下
- 捕まるとチェックポイント(最後に取得した印)からリトライ
- 操作: WASD 移動 / マウス 視点 / Shift しゃがみ / F ライト / E 調べる

## 次のマイルストーン

- PositionalAudio(足音・呼吸音)
- 守護者ビジュアルの作り込み(触手・湿った質感)
- ④⑤⑥⑦の演出強化(水位下降、環境ストーリー)
- 電池残量UI、扉ギミック

## 技術スタック

- Vite
- Three.js(`three/examples/jsm/controls/PointerLockControls.js` を使用)

## ディレクトリ構成

```
/
  index.html        エントリーポイント、HUD・オーバーレイ
  /src
    main.js         起動
    /core           Game, Input, Collision
    /player         Player
    /world          buildLevel, Interactables
    /entities       Guardian, GuardianStates
    /ui             HUD
    /save           Checkpoint
```
