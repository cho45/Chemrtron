/**
 * Go (Golang) Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const golangIndexer = {
  id: 'golang',
  name: 'Go',
  color: '#00ADD8',
  testSpec: {
    expectedSymbols: ['Go Spec: Types', 'std: fmt', 'std: net/http'],
    minEntries: 200
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    // 1. Language Specification
    const specUrl = 'https://go.dev/ref/spec';
    const specDoc = await ctx.fetchDocument(specUrl);
    const specHeadings = specDoc.querySelectorAll('h2[id], h3[id]');
    for (const h of specHeadings) {
      const title = h.textContent.trim();
      const id = h.getAttribute('id');
      if (title && id) {
        ctx.pushIndex(`Go Spec: ${title}`, `https://go.dev/ref/spec#${id}`);
      }
    }

    // 2. Standard Library
    const stdUrl = 'https://pkg.go.dev/std';
    const stdDoc = await ctx.fetchDocument(stdUrl);
    const links = stdDoc.querySelectorAll('table tr td:first-child a[href]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        // Extract package path from href like "/net/http@go1.25.5" -> "net/http"
        const pkgPath = href.split('@')[0].replace(/^\//, '');
        if (pkgPath && pkgPath !== 'std') {
          ctx.pushIndex(`std: ${pkgPath}`, `https://pkg.go.dev/${pkgPath}`);
        }
      }
    }
  }
};

export default golangIndexer;