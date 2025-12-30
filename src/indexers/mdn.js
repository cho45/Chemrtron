/**
 * MDN Web Docs Indexer
 * MDNの公式検索インデックスを使用してインデックスを作成します。
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const mdnIndexer = {
  id: 'mdn',
  name: 'MDN Web Docs',
  color: '#212121',
  testSpec: {
    expectedSymbols: ['JavaScript', 'HTML', 'CSS', 'fetch'],
    minEntries: 5000
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const searchIndexUrl = 'https://developer.mozilla.org/en-US/search-index.json';
    const data = await ctx.fetchJSON(searchIndexUrl);

    if (!Array.isArray(data)) {
      throw new Error('Invalid MDN search index format');
    }

    const prefix = '/en-US/docs/';

    for (const item of data) {
      if (item.title && item.url) {
        // インデックスサイズ削減のため、共通のprefix '/en-US/docs/' を削除
        let relativeUrl = item.url;
        if (relativeUrl.startsWith(prefix)) {
          relativeUrl = relativeUrl.substring(prefix.length);
        }
        ctx.pushIndex(item.title, relativeUrl);
      }
    }
  },

  /**
   * URLテンプレート
   * relativeUrl が 'Web/JavaScript' の場合、
   * 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' に変換される
   */
  urlTemplate: 'https://developer.mozilla.org/en-US/docs/${url}',

  /**
   * カスタムCSS
   * MDNの雰囲気に合わせるための最小限のスタイル
   */
  css: `
    :root {
      --mdn-black: #1b1b1b;
      --mdn-blue: #83d0f2;
    }
    body {
      font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--mdn-black);
    }
    a {
      color: #0060df;
    }
    code {
      background-color: #f2f2f2;
      padding: 0.1em 0.3em;
      border-radius: 0.3em;
      font-family: "Menlo", "Monaco", "Consolas", monospace;
    }
  `
};

export default mdnIndexer;
