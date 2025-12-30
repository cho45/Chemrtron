/**
 * pandas Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const pandasIndexer = {
  id: 'pandas',
  name: 'pandas',
  color: '#150458',

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const baseUrl = 'https://pandas.pydata.org/docs/reference/';
    const indexUrl = baseUrl + 'index.html';
    const doc = await ctx.fetchDocument(indexUrl);

    // Get all subpages from the main navigation or the list in the content
    const subpageLinks = Array.from(doc.querySelectorAll('.toctree-wrapper a[href$=".html"]'))
      .map(a => new URL(a.getAttribute('href'), indexUrl).href);

    // Unique subpages
    const uniqueSubpages = [...new Set(subpageLinks)];

    await ctx.crawl(uniqueSubpages, (url, subDoc) => {
      // Each subpage has tables containing API links
      const apiLinks = subDoc.querySelectorAll('table.table a[href^="api/"]');
      for (const link of apiLinks) {
        const title = link.textContent.trim();
        const href = link.getAttribute('href');
        if (title && href) {
          // href is like "api/pandas.read_pickle.html"
          ctx.pushIndex(title, href);
        }
      }
    });
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://pandas.pydata.org/docs/reference/${url}'
};

export default pandasIndexer;
