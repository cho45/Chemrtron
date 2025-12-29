# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Chemrtron は Electron ベースのドキュメントビューアアプリケーション。様々なプログラミング言語やフレームワークのドキュメントに対して、ファジーマッチングによるインクリメンタル検索を提供する。

## 開発コマンド

### 起動
```bash
electron .
```

### ビルド
```bash
make package
# または
./dev/package.sh
```

ビルド出力は `./build/releases` に生成される。

### リリース
```bash
make release
```

リリースプロセス:
1. `ChangeLog` を更新
2. `VERSION` ファイルのバージョンを更新
3. `git commit -a && git push`
4. `make release` でパッケージ作成、タグ付け、GitHub リリースへのアップロード

## アーキテクチャ

### 2ウィンドウアーキテクチャ

Chemrtron は2つの BrowserWindow を持つ:

1. **Main Viewer Window** ([viewer.html](viewer.html))
   - ユーザーが直接操作する検索・閲覧用ウィンドウ
   - 起動時のサイズ: 1440x900
   - [src/chemr-viewer.js](src/chemr-viewer.js) で実装

2. **Indexer Window** ([indexer.html](indexer.html))
   - ドキュメントのインデックス作成専用の隠しウィンドウ
   - 開発モード時のみ表示される
   - [src/indexer.js](src/indexer.js) で実装

### IPC 通信

両ウィンドウは Electron main process ([main.js](main.js:1)) を経由して間接的に通信する:

- [src/channel.js](src/channel.js) - IPC 通信の抽象化レイヤー
  - Promise ベースのリクエスト/レスポンスパターン
  - 各リクエストに一意のIDを付与し、コールバックで結果を受け取る
  - 通知機能も提供

### インデックスシステム

#### インデクサの定義

インデクサは [indexers/](indexers/) ディレクトリ内の JavaScript ファイルとして定義される。各インデクサは以下のインターフェースを実装:

```javascript
indexer = {
    id: 'unique-id',           // 一意の識別子
    name: 'Display Name',      // 表示名
    color: '#hexcolor',        // UI での色

    index: function (ctx) {    // インデックス作成処理
        // ctx.pushIndex(title, url) を呼び出してエントリを追加
        // Promise を返す
    },

    item: function (item) {    // 検索結果の変換
        // item[0] = title, item[1] = url
        // 返り値が検索結果として表示される
    },

    CSS: function () {         // ビューアに適用する CSS (オプション)
        return 'css string';
    }
};
```

例: [indexers/mdn.js](indexers/mdn.js)

#### インデックスのキャッシュ

- インデックスデータは `~/.chemr/cache/{id}.dat` にキャッシュされる
- ファイル形式: メタデータ行 + タブ区切りテキスト (title\turl\n)
- キャッシュがある場合は再インデックスをスキップ
- 再インデックスは `reindex: true` パラメータで強制可能

### 検索アルゴリズム

[src/chemr.js](src/chemr.js:74-72) の `createSearchIterator`:
- クエリは正規表現に変換され、インデックスデータに対して実行される
- 最大300件の結果を取得
- スコアリング: マッチした文字数が多いほど高スコア
- 結果はスコア順にソート

## 設定とパス

[config.js](config.js) で定義:
- `~/.chemr/cache` - インデックスキャッシュ
- `~/.chemr/indexers` - カスタムインデクサ
- `~/.chemr/indexers/builtin` - ビルトインインデクサのコピー
- `~/.chemr/docsets` - Dash形式のdocset

## グローバルショートカット

設定画面から登録可能。Electron の globalShortcut API を使用。キー名は Electron 形式に変換される ([main.js](main.js:135-139))。

## 開発モード

`config.DEBUG = true` または設定画面から切り替え可能:
- Main window と Indexer window の DevTools が開く
- Indexer window が表示される
