/**
 * HTML Standard (WHATWG) Indexer
 * Uses html.spec.whatwg.org/multipage/
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

    const links = doc.querySelectorAll('ol.toc a[href]');
    for (const link of links) {
      const text = link.textContent.trim().replace(/\s+/g, ' ');
      const href = link.getAttribute('href');
      if (href) {
        ctx.pushIndex(text, href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://html.spec.whatwg.org/multipage/${url}',

  /**
   * カスタムCSS
   */
  css: `
    body {
      font-family: sans-serif;
      line-height: 1.5;
      padding: 1em;
      max-width: 800px;
      margin: 0 auto;
    }
    a { color: #E34F26; }
    code {
      background: #f4f4f4;
      padding: 2px 4px;
      border-radius: 4px;
    }
  `
};

export default htmlIndexer;
