/**
 * HTML Standard Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const htmlIndexer = {
  id: 'html',
  name: 'HTML Standard',
  color: '#E34F26',

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://html.spec.whatwg.org/multipage/';
    const doc = await ctx.fetchDocument(url);

    // ol.toc contains the table of contents
    const links = doc.querySelectorAll('ol.toc a[href]');
    for (const link of links) {
      const title = link.textContent.trim().replace(/\s+/g, ' ');
      const href = link.getAttribute('href');
      if (title && href) {
        ctx.pushIndex(title, href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://html.spec.whatwg.org/multipage/${url}'
};

export default htmlIndexer;