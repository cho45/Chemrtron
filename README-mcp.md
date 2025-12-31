# Chemrtron MCP Server

Chemrtron を Model Context Protocol (MCP) サーバーとして動作させ、AIエージェント（Claude Desktop, Cursor, IDE など）からローカルのドキュメントセットを検索・閲覧できるようにします。

## 特徴

- **高速なローカル検索**: Chemrtron が作成した既存のインデックスキャッシュを直接参照するため、ミリ秒単位で検索結果を返せます。
- **高品質なコンテンツ抽出**: 各ドキュメントセットに合わせた CSS セレクタにより、ナビゲーションや広告を除いた本文のみを抽出し、AI が理解しやすい Markdown 形式に変換して提供します。
- **広範な対応ドキュメント**: MDN, Node.js, Python, Rust, Go など、Chemrtron がサポートする全てのインデクサを利用可能です。

## セットアップ

### 1. ビルド
MCP サーバーのエントリポイントを含むプロジェクトをビルドします。
```bash
npm run build
```

### 2. クライアントへの登録
MCP クライアント（Claude Desktop 等）に、Chemrtron が書き出した `mcp.js` を登録します。

このファイルは **Chemrtron アプリ本体を一度起動すると、自動的に以下のパスに作成（または更新）されます**。

- **コマンド**: `node`
- **引数**: (ホームディレクトリ)/`.chemr/mcp/mcp.js` への絶対パス

#### Claude Desktop の設定例 (`~/Library/Application Support/Claude/mcpConfig.json`)

**macOS:**
```json
{
  "mcpServers": {
    "chemrtron": {
      "command": "node",
      "args": ["/Users/YOUR_NAME/.chemr/mcp/mcp.js"]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "chemrtron": {
      "command": "node",
      "args": ["C:/Users/YOUR_NAME/.chemr/mcp/mcp.js"]
    }
  }
}
```

## 提供されるツール

### `list_available_docsets`
現在キャッシュされており、検索可能なドキュメントセット（`mdn`, `nodejs`, `python` など）の一覧を返します。
AI エージェントは通常、最初にこのツールを呼び出して「何について知っているか」を把握します。

### `search_docs`
ドキュメントセット内をファジー検索します。
- **引数**:
  - `query`: 検索クエリ (例: `useEffect`, `fs.readFile`)
  - `indexerId` (任意): 特定のドキュメントセット (例: `mdn`) に絞り込む場合に指定

### `read_doc`
`search_docs` の結果として得られた URI を指定して、ドキュメントの本文を Markdown で取得します。
- **引数**:
  - `uri`: `chemr://doc/{indexerId}/{path}` 形式の URI

## 仕組み

- **データの共有**: Electron アプリ版 Chemrtron と同じ設定 (`~/.chemr/settings.json`) およびキャッシュ (`~/.chemr/cache/`) を参照します。
- **ヘッドレス動作**: MCP サーバーは GUI を必要とせず、Node.js プロセスとして独立して動作します。
- **インデクサの拡張**: `src/indexers/*.js` 内の定義に `contentSelector` (CSS セレクタ) を追加することで、抽出の精度をカスタマイズできます。

## 開発とテスト

### 統合テスト
モックサーバーを使用して MCP 通信を検証するテストが用意されています。
```bash
npm run test:mcp
```
このテストでは、ビルド済みの `out/main/mcp.js` を実際に起動し、JSON-RPC 経由での initialize, tool 呼び出し, resource 取得を検証します。
