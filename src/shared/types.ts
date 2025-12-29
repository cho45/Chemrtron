/**
 * Chemrtron Type Definitions
 */

/**
 * Search result item format: [title, url, formatted?, score?]
 * - title: 検索結果のタイトル
 * - url: ドキュメントのURL
 * - formatted: ハイライト付きHTML（検索後に追加）
 * - score: スコア（低いほど優先、検索後に追加）
 */
export type SearchResultItem = [string, string, string?, number?] & { score?: number };

/**
 * Indexer context - インデックス作成時に使用
 * インデクサーがインデックスを作成する際に提供されるコンテキスト
 */
export interface IndexerContext {
  /**
   * インデックスにエントリを追加
   * @param title 検索結果のタイトル
   * @param url ドキュメントのURL
   */
  pushIndex(title: string, url: string): void;

  /**
   * URLからHTMLドキュメントを取得
   * @param url 取得するURL
   * @returns Document オブジェクト
   */
  fetchDocument(url: string): Promise<Document>;

  /**
   * URLからJSONを取得
   * @param url 取得するURL
   * @returns JSONオブジェクト
   */
  fetchJSON<T = any>(url: string): Promise<T>;

  /**
   * URLからテキストを取得
   * @param url 取得するURL
   * @returns テキスト文字列
   */
  fetchText(url: string): Promise<string>;

  /**
   * 複数のURLを巡回してコールバックを実行
   * @param urls 巡回するURLのリスト
   * @param callback 各URLに対して実行するコールバック
   */
  crawl(urls: string[], callback: (url: string, doc: Document) => void): Promise<void>;
}

/**
 * Indexer definition - インデクサーの定義
 * ESM形式でエクスポートされる
 */
export interface IndexerDefinition {
  /** インデクサーの一意な識別子 */
  id: string;

  /** インデクサーの表示名 */
  name: string;

  /** テーマカラー（16進数カラーコード） */
  color?: string;

  /** アイコン（将来の実装用） */
  icon?: string;

  /**
   * インデックスを作成する関数
   * @param ctx インデクサーコンテキスト
   */
  index(ctx: IndexerContext): Promise<void>;

  /**
   * URLテンプレート文字列（オプション）
   * インデックスに保存された相対URLを完全なURLに変換する
   * 例: "https://example.com/docs/${url}"
   * ${url}が相対URLに置換される
   */
  urlTemplate?: string;

  /**
   * ドキュメント表示時に注入するCSS（オプション）
   */
  css?: string;
}

/**
 * Settings - アプリケーション設定
 */
export interface Settings {
  enabled: string[];
  developerMode: boolean;
  globalShortcut?: string;
}

/**
 * Cache metadata
 */
export interface CacheMetadata {
  id: string;
  name: string;
  version: string;
  created: number;
}

/**
 * Serializable indexer metadata (IPC経由で送信可能)
 */
export interface SerializableIndexerMetadata {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  /** URLテンプレート文字列 */
  urlTemplate?: string;
  /** CSS文字列 */
  css?: string;
}

/**
 * IPC channel names
 */
export const IPC_CHANNELS = {
  GET_INDEX: 'get-index',
  LOAD_DOCUMENT: 'load-document',
  UPDATE_SETTINGS: 'update-settings',
  PROGRESS: 'progress',
  KEYBOARD_ACTION: 'keyboard-action'
} as const;

/**
 * Keyboard action types
 */
export type KeyboardAction =
  | 'focus-search'
  | 'select-next'
  | 'select-previous'
  | 'clear-input'
  | 'autocomplete'
  | 'select-result'
  | 'go-back'
  | 'go-forward';
