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

    const tables = doc.querySelectorAll('table.indextable');
    for (const table of tables) {
      const lis = table.querySelectorAll('td > ul > li');
      for (const li of lis) {
        // The main term is the text/links in this LI before any nested UL
        const termNodes = [];
        let subUl = null;
        for (const child of li.childNodes) {
          if (child.nodeName === 'UL') {
            subUl = child;
            break;
          }
          termNodes.push(child);
        }

        const mainText = termNodes.map(n => n.textContent).join('').trim().replace(/\s+/g, ' ');
        // Remove trailing (parentheses) like "(module)" and reference markers like "[1]"
        const cleanMainText = mainText.replace(/\s*\(.+\)\s*$/, '').replace(/,?\s*\[\d+\]/g, '').trim() || mainText;

        // Collect links for the main term
        for (const node of termNodes) {
          const links = node.nodeName === 'A' ? [node] : (node.querySelectorAll ? node.querySelectorAll('a') : []);
          for (const a of links) {
            const href = a.getAttribute('href');
            if (href && !a.textContent.match(/^\[\d+\]$/)) {
              ctx.pushIndex(cleanMainText, href);
            }
          }
        }

        // Handle sub-entries in nested UL
        if (subUl) {
          const subLis = subUl.querySelectorAll('li');
          for (const subLi of subLis) {
            // Get text of this sub-LI excluding any deeper UL (though rare)
            const subTermNodes = [];
            for (const child of subLi.childNodes) {
              if (child.nodeName === 'UL') break;
              subTermNodes.push(child);
            }
            const subText = subTermNodes.map(n => n.textContent).join('').trim().replace(/\s+/g, ' ');
            const cleanSubText = subText.replace(/\s*\(.+\)\s*$/, '').replace(/,?\s*\[\d+\]/g, '').trim();
            const fullText = cleanSubText ? `${cleanMainText} ${cleanSubText}` : cleanMainText;

            for (const node of subTermNodes) {
              const links = node.nodeName === 'A' ? [node] : (node.querySelectorAll ? node.querySelectorAll('a') : []);
              for (const a of links) {
                const href = a.getAttribute('href');
                if (href && !a.textContent.match(/^\[\d+\]$/)) {
                  ctx.pushIndex(fullText, href);
                }
              }
            }
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
