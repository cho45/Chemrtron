/**
 * Android Developer Reference Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const androidIndexer = {
  id: 'android',
  name: 'Android',
  color: '#3DDC84',
  testSpec: {
    expectedSymbols: ['android.app', 'Activity', 'View'],
    minEntries: 1000
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const targets = [
      'https://developer.android.com/reference/packages',
      'https://developer.android.com/reference/classes'
    ];

    await ctx.crawl(targets, (url, doc) => {
      // Android reference tables have the name in the first cell's link
      const links = doc.querySelectorAll('table tr td:first-child a[href]');
      for (const link of links) {
        const title = link.textContent.trim();
        const href = link.getAttribute('href');
        if (title && href) {
          ctx.pushIndex(title, href);
        }
      }
    });
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://developer.android.com${url}'
};

export default androidIndexer;
