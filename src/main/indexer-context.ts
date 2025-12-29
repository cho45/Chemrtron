/**
 * Indexer Context Implementation
 * インデクサーがインデックスを作成する際に使用するコンテキスト
 */

import type { IndexerContext } from '../shared/types';

/**
 * IndexerContext の実装を作成
 */
export function createIndexerContext(): IndexerContext & { getIndexData(): string } {
  const indexEntries: Array<{ title: string; url: string }> = [];

  return {
    /**
     * インデックスにエントリを追加
     */
    pushIndex(title: string, url: string): void {
      indexEntries.push({ title, url });
    },

    /**
     * URLからHTMLドキュメントを取得
     * TODO: 将来的に実装（現在は未対応）
     */
    async fetchDocument(_url: string): Promise<Document> {
      throw new Error('fetchDocument is not implemented yet');
    },

    /**
     * URLからJSONを取得
     */
    async fetchJSON<T = any>(url: string): Promise<T> {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON from ${url}: ${response.statusText}`);
      }
      return response.json();
    },

    /**
     * URLからテキストを取得
     */
    async fetchText(url: string): Promise<string> {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch text from ${url}: ${response.statusText}`);
      }
      return response.text();
    },

    /**
     * 複数のURLを巡回してコールバックを実行
     * TODO: 将来的に実装（現在は未対応）
     */
    async crawl(_urls: string[], _callback: (url: string, doc: Document) => void): Promise<void> {
      throw new Error('crawl is not implemented yet');
    },

    /**
     * インデックスデータを取得（タブ区切り形式）
     */
    getIndexData(): string {
      // 既存フォーマット: \ntitle\turl\ntitle\turl\n...
      return '\n' + indexEntries.map(entry => `${entry.title}\t${entry.url}`).join('\n') + '\n';
    }
  };
}
