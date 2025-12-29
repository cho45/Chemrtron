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
 */
export interface IndexerContext {
  pushIndex(title: string, url: string): void;
  fetchDocument(url: string): Promise<Document>;
  fetchJSON(url: string): Promise<any>;
  fetchText(url: string): Promise<string>;
  crawl(urls: string[], callback: (url: string, doc: Document) => void): Promise<void>;
  finalize(): string;
}

/**
 * Indexer definition - インデクサーの定義
 */
export interface IndexerDefinition {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  index(ctx: IndexerContext): Promise<void>;
  item?(item: SearchResultItem): SearchResultItem;
  beforeSearch?(query: string): string;
  CSS?(): string;
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
