/**
 * PHP Manual Indexer
 * Uses php.net function and method listing.
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const phpIndexer = {
  id: 'php',
  name: 'PHP',
  color: '#4F5B93',
  testSpec: {
    expectedSymbols: ['strlen', 'array_map', 'json_encode'],
    minEntries: 1000
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://www.php.net/manual/en/indexes.functions.php';
    const doc = await ctx.fetchDocument(url);

    // リスト内のすべての a タグを取得（関数名が含まれる）
    const links = doc.querySelectorAll('ul.gen-index a');
    for (const link of links) {
      const text = link.textContent.trim();
      const href = link.getAttribute('href');
      if (href) {
        ctx.pushIndex(text, href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://www.php.net/manual/en/${url}',

  /**
   * カスタムCSS
   */
  css: `
    body {
      font-family: "Fira Sans", "Source Sans Pro", Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    #layout-content {
      padding: 20px;
    }
    .refentry {
      margin-bottom: 2em;
    }
    code {
      background-color: #f1f1f1;
      padding: 2px 4px;
      border-radius: 3px;
    }
  `
};

export default phpIndexer;
