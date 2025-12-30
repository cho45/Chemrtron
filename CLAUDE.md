# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Chemrtron は Electron ベースのドキュメントビューアアプリケーション。様々なプログラミング言語やフレームワークのドキュメントに対して、ファジーマッチングによるインクリメンタル検索を提供する。モダンな Electron (WebContentsView) と Vue 3 を使用して再構築されている。

## 開発コマンド

### 起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

ビルド出力は `./out` (コンパイル済みコード) および `./dist` (パッケージ) に生成される。

### 型チェック
```bash
npm run typecheck
```

### テスト
```bash
npm run test
```

## アーキテクチャ

### シングルウィンドウ + WebContentsView アーキテクチャ

Chemrtron は 1 つのメインウィンドウ内で、UI レイヤーとドキュメント表示レイヤーを分離して管理する:

1. **Main Window (Renderer)**: Vue 3 + Pinia で構築された UI。検索、インデクサー選択、設定を担当。
2. **WebContentsView (Native)**: Electron のネイティブレイヤーで動作するドキュメント表示エリア。Renderer プロセスの UI の上に重なるように配置される。

### インデックスシステム

#### インデクサの定義

インデクサは `src/indexers/` 内の JavaScript ファイル (ESM) として定義される。

```javascript
export default {
    id: 'unique-id',
    name: 'Display Name',
    color: '#hexcolor',
    async index(ctx) {
        // ctx.pushIndex(title, url) を呼び出してエントリを追加
    }
};
```

#### インデックスのキャッシュ

- インデックスデータは `~/.chemr/cache/{id}.dat` にキャッシュされる。
- メインプロセス (`src/main/cache-manager.ts`) が管理。

### 検索アルゴリズム

`src/shared/search-algorithm.ts` に実装されている:
- スペースを `.*?` に変換した正規表現によるファジー検索。
- スコアリング: クエリの各文字間の距離に基づき、より密接にマッチするものを優先。

## IPC 通信

`src/shared/types.ts` で定義された型安全なチャンネルを使用する:
- `getIndex`: インデックスデータの取得（必要に応じて作成）。
- `updateSettings` / `getSettings`: 設定の同期。
- `keyboard-action`: メインプロセスからのキーボード操作通知。

## 設定

`~/.chemr/settings.json` に保存される。
- 有効なインデクサーのリスト。
- グローバルショートカット。
- デベロッパーモード。

## UI 調整 (macOS)

macOS では `titleBarStyle: 'hiddenInset'` を使用しているため:
- `App.vue` にドラッグ領域 (`-webkit-app-region: drag`) を設定している。
- 信号機ボタンを避けるため、サイドバー上部に `32px` のスペーサーを配置。