/**
 * Indexer Context Implementation
 * インデクサーがインデックスを作成する際に使用するコンテキスト
 */

import { parseHTML } from 'linkedom';
import type { IndexerContext } from '../shared/types';

/**
 * IndexerContext の実装を作成
 * @param progressCallback 進捗通知コールバック
 */
export function createIndexerContext(
  progressCallback?: (state: string, current: number, total: number) => void
): IndexerContext & { getIndexData(): string } {
  const indexEntries: Array<{ title: string; url: string }> = [];
  let current = 0;
  let total = 1;

  return {
    /**
     * インデックスにエントリを追加
     */
    pushIndex(title: string, url: string): void {
      indexEntries.push({ title, url });
    },

    /**
     * 進捗コールバック
     */
    progress(state: string, currentValue: number, totalValue: number): void {
      current = currentValue;
      total = totalValue;
      if (progressCallback) {
        progressCallback(state, current, total);
      }
    },

    /**
     * URLからHTMLドキュメントを取得
     */
    async fetchDocument(url: string): Promise<Document> {
      const html = await this.fetchText(url);
      const { document } = parseHTML(html);
      return document as unknown as Document;
    },

    /**
     * URLからJSONを取得
     */
    async fetchJSON<T = unknown>(url: string): Promise<T> {
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
     */
    async crawl(urls: string[], callback: (url: string, doc: Document) => void): Promise<void> {
      this.progress('crawl.start', 0, urls.length);
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const doc = await this.fetchDocument(url);
          callback(url, doc);
        } catch (e) {
          console.error(`[IndexerContext] Failed to crawl ${url}:`, e);
        }
        this.progress('crawl.progress', i + 1, urls.length);
      }
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
