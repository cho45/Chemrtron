/**
 * Clojure API Reference Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const clojureIndexer = {
  id: 'clojure',
  name: 'Clojure',
  color: '#5881d8',
  testSpec: {
    expectedSymbols: ['map', 'reduce', 'filter', 'defn'],
    minEntries: 500
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://clojure.github.io/clojure/api-index.html';
    const doc = await ctx.fetchDocument(url);

    // Links are in the main content area, inside groups under headings
    const links = doc.querySelectorAll('a[href$=".html"], a[href*=".html#"]');

    for (const link of links) {
      const title = link.textContent.trim();
      const href = link.getAttribute('href');

      // The index page has many links, we want those that are likely API entries
      // In Clojure's api-index.html, these links are typically children of some specific divs
      // but a broad selector might work if we filter out non-API links.
      // Looking at the structure, the API links are relative to the current page.
      if (title && href && !href.startsWith('http') && !href.startsWith('api-index.html')) {
        ctx.pushIndex(title, href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://clojure.github.io/clojure/${url}'
};

export default clojureIndexer;
