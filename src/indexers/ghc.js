/**
 * Haskell (GHC) Libraries Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const ghcIndexer = {
  id: 'ghc',
  name: 'Haskell (GHC)',
  color: '#5e5086',
  testSpec: {
    expectedSymbols: ['Prelude', 'Data.List', 'Control.Monad'],
    minEntries: 1000
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://downloads.haskell.org/~ghc/latest/docs/html/libraries/doc-index-All.html';
    const doc = await ctx.fetchDocument(url);

    const rows = doc.querySelectorAll('tr');
    let currentSrc = '';

    for (const row of rows) {
      const srcCell = row.querySelector('td.src');
      const altCell = row.querySelector('td.alt');
      const moduleCell = row.querySelector('td.module');

      if (srcCell) {
        currentSrc = srcCell.textContent.trim();
      }

      if (moduleCell) {
        const alt = altCell ? altCell.textContent.trim() : '';
        const links = moduleCell.querySelectorAll('a');

        for (const link of links) {
          const moduleName = link.textContent.trim();
          const href = link.getAttribute('href');
          if (href) {
            // "abs 1 (Function) Data.Array"
            const title = [currentSrc, alt, moduleName].filter(Boolean).join(' ');
            ctx.pushIndex(title, href);
          }
        }
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://downloads.haskell.org/~ghc/latest/docs/html/libraries/${url}'
};

export default ghcIndexer;
