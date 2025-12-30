/**
 * OpenGL 4 Reference Pages Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const openglIndexer = {
  id: 'opengl',
  name: 'OpenGL',
  color: '#5586A4',
  testSpec: {
    expectedSymbols: ['glDrawArrays', 'glClear', 'glTexImage2D'],
    minEntries: 400
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://registry.khronos.org/OpenGL-Refpages/gl4/html/indexflat.php';
    const doc = await ctx.fetchDocument(url);

    // Flat index contains a list of links to .xhtml files
    const links = doc.querySelectorAll('a[href$=".xhtml"]');
    const seen = new Set();

    for (const link of links) {
      const title = link.textContent.trim();
      const href = link.getAttribute('href');

      if (title && href && !seen.has(href)) {
        ctx.pushIndex(title, href);
        seen.add(href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://registry.khronos.org/OpenGL-Refpages/gl4/html/${url}'
};

export default openglIndexer;
