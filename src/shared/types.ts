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

  /**
   * 進捗コールバック
   * @param state 進捗の状態（"init", "fetch.start", "fetch.done", "crawl.start", "crawl.progress", "done" など）
   * @param current 現在の進捗
   * @param total 全体の作業量
   */
  progress(state: string, current: number, total: number): void;
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
   * 著作権情報（オプション）
   */
  copyright?: string;

  /**
   * テスト用の期待値（オプション）
   */
  testSpec?: {
    expectedSymbols: string[];
    minEntries?: number;
  };

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
  lastSelected?: string; // 前回選択したインデクサーID
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
  /** 著作権情報 */
  copyright?: string;
  /** URLテンプレート文字列 */
  urlTemplate?: string;
  /** CSS文字列 */
  css?: string;
}

/**
 * Progress information
 */
export interface ProgressInfo {
  id: string;
  state: string;
  current: number;
  total: number;
}

/**
 * Find in page options
 */
export interface FindInPageOptions {
  forward?: boolean;
  findNext?: boolean;
  matchCase?: boolean;
}

/**
 * About information
 */
export interface AboutInfo {
  version: string;
  contributors: string;
  credits: string;
  indexerCopyrights: Array<{ id: string; name: string; copyright: string }>;
}

/**
 * IPC channel names
 */
export const IPC_CHANNELS = {
  GET_INDEX: 'get-index',
  GET_ALL_INDEXERS: 'get-all-indexers',
  LOAD_DOCUMENT: 'load-document',
  UPDATE_SETTINGS: 'update-settings',
  GET_SETTINGS: 'get-settings',
  GET_ABOUT_INFO: 'get-about-info',
  PROGRESS: 'progress',
  KEYBOARD_ACTION: 'keyboard-action',
  URL_CHANGED: 'url-changed',
  UPDATE_VIEW_BOUNDS: 'update-view-bounds',
  FIND_IN_PAGE: 'find-in-page',
  STOP_FIND_IN_PAGE: 'stop-find-in-page'
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
  | 'go-forward'
  | 'open-settings'
  | 'open-indexer-search'
  | 'open-find'
  | 'open-about';
