/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'rust',
  name: 'Rust',
  color: '#ce412b',
  testSpec: {
    expectedSymbols: ['unsafe', 'keyword', 'Vec', 'Expressions'],
    minEntries: 500
  },
  urlTemplate: 'https://doc.rust-lang.org/${url}',
  async index(ctx) {
    // 1. Standard Library Items
    const stdBaseUrl = 'std/';
    const stdAllDoc = await ctx.fetchDocument('https://doc.rust-lang.org/std/all.html');
    stdAllDoc.querySelectorAll('.all-items a').forEach(a => {
      ctx.pushIndex(a.textContent.trim(), stdBaseUrl + a.getAttribute('href'));
    });

    // 2. Keywords
    const stdIndexDoc = await ctx.fetchDocument('https://doc.rust-lang.org/std/index.html');
    stdIndexDoc.querySelectorAll('a[href^="keyword."]').forEach(a => {
      ctx.pushIndex(`keyword: ${a.textContent.trim()}`, stdBaseUrl + a.getAttribute('href'));
    });

    // 3. The Rust Reference (Language Specification)
    // The main sidebar is JS-driven, but there is a static toc.html for noscript users.
    const refTocDoc = await ctx.fetchDocument('https://doc.rust-lang.org/reference/toc.html');
    refTocDoc.querySelectorAll('.chapter a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      // title often contains chapter numbers like "8.2. Expressions", we keep it as is or clean it.
      // But based on user's feedback, "Expressions" is what they expect.
      if (title && href && href !== 'index.html') {
        ctx.pushIndex(`ref: ${title}`, `reference/${href}`);
      }
    });
  }
};