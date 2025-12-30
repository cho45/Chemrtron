/**
 * Java SE Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const javaIndexer = {
  id: 'java',
  name: 'Java SE',
  color: '#5382A1',
  testSpec: {
    expectedSymbols: ['String', 'ArrayList', 'HashMap', 'Thread'],
    minEntries: 1000
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://docs.oracle.com/en/java/javase/23/docs/api/allclasses-index.html';
    const doc = await ctx.fetchDocument(url);

    // Modern Javadoc uses a div with class "col-first" for the class name and link
    const links = doc.querySelectorAll('.col-first a[href]');
    for (const link of links) {
      const title = link.textContent.trim();
      const href = link.getAttribute('href');
      if (title && href) {
        ctx.pushIndex(title, href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://docs.oracle.com/en/java/javase/23/docs/api/${url}'
};

export default javaIndexer;
