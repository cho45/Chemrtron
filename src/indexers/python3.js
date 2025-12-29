/**
 * Python 3 Indexer
 * Uses docs.python.org/3/genindex-all.html
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const python3Indexer = {
  id: 'python3',
  name: 'Python 3',
  color: '#3776AB',

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://docs.python.org/3/genindex-all.html';
    const doc = await ctx.fetchDocument(url);

    const data = doc.querySelectorAll('table.indextable td > dl > *');
    let currentDt = '';

    for (const it of data) {
      if (it.tagName === 'DT') {
        // Remove trailing (parentheses) like "(module)"
        currentDt = it.textContent.replace(/\(.+\)\s*$/, '').trim();
        const a = it.querySelector('a');
        if (a && a.getAttribute('href')) {
          ctx.pushIndex(currentDt, a.getAttribute('href'));
        }
      } else if (it.tagName === 'DD') {
        const links = it.querySelectorAll('a');
        for (const link of links) {
          const href = link.getAttribute('href');
          if (href) {
            ctx.pushIndex(`${currentDt} ${link.textContent.trim()}`, href);
          }
        }
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://docs.python.org/3/${url}',

  /**
   * カスタムCSS
   */
  css: `
    body {
      font-family: 'Lucida Grande', Arial, sans-serif;
      line-height: 1.5;
    }
    .document {
      padding: 10px 20px;
    }
    code {
      background-color: #ecf0f3;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
    }
    pre {
      background-color: #ecf0f3;
      padding: 10px;
      overflow: auto;
    }
  `
};

export default python3Indexer;
