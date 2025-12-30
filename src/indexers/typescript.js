
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'typescript',
  name: 'TypeScript',
  color: '#3178c6',
  testSpec: {
    expectedSymbols: ['Utility Types', 'Partial', 'tsconfig'],
    minEntries: 50
  },
  urlTemplate: 'https://www.typescriptlang.org${url}',
  async index(ctx) {
    const baseUrl = 'https://www.typescriptlang.org';
    
    // 1. Index Handbook & Reference Chapters from Sidebar
    const handbookDoc = await ctx.fetchDocument(baseUrl + '/docs/handbook/intro.html');
    handbookDoc.querySelectorAll('nav#sidebar a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href && href.startsWith('/docs/')) {
        ctx.pushIndex(title, href);
      }
    });

    // 2. Index Utility Types specifically
    const utilityDoc = await ctx.fetchDocument(baseUrl + '/docs/handbook/utility-types.html');
    utilityDoc.querySelectorAll('h2 code').forEach(code => {
      const title = code.textContent.trim();
      const h2 = code.parentElement;
      const id = h2?.getAttribute('id');
      if (title && id) {
        ctx.pushIndex(`type: ${title}`, `/docs/handbook/utility-types.html#${id}`);
      }
    });

    // 3. Index TSConfig options
    // Since the page is dynamic, we try to grab what's in the static HTML or use a known set.
    const tsconfigDoc = await ctx.fetchDocument(baseUrl + '/tsconfig');
    tsconfigDoc.querySelectorAll('a[href^="#"]').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && title.length > 2 && !title.includes(' ')) {
        ctx.pushIndex(`tsconfig: ${title}`, `/tsconfig${href}`);
      }
    });
  }
};
