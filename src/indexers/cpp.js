
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'cpp',
  name: 'C++',
  color: '#004482',
  testSpec: {
    expectedSymbols: ['vector', 'unique_ptr', 'constexpr'],
    minEntries: 300
  },
  urlTemplate: 'https://en.cppreference.com/w/cpp/${url}',
  async index(ctx) {
    const baseUrl = 'https://en.cppreference.com/w/cpp/';
    
    // 1. Symbols Index
    const symbolHtml = await ctx.fetchText(baseUrl + 'symbol_index.html');
    const symbolRegex = /<a href="([^"]+)"[^>]*><tt>([^<]+)<\/tt><\/a>\s*(?:\(<(?:code|tt)>([^<]+)<\/(?:code|tt)>\))?/g;
    const seen = new Set();
    
    let match;
    while ((match = symbolRegex.exec(symbolHtml)) !== null) {
      const href = match[1].replace(/^\/w\/cpp\//, '');
      const name = match[2].trim().replace(/<.*>/g, '');
      const context = match[3]?.trim() || '';
      const fullName = context ? `${context}::${name}` : name;
      if (!seen.has(fullName + href)) {
        ctx.pushIndex(fullName, href);
        seen.add(fullName + href);
      }
    }

    // 2. Keywords (improved parsing)
    const keywordDoc = await ctx.fetchDocument(baseUrl + 'keyword');
    keywordDoc.querySelectorAll('#mw-content-text a').forEach(a => {
      const titleAttr = a.getAttribute('title') || '';
      if (titleAttr.startsWith('cpp/keyword/')) {
        const name = a.textContent.trim();
        let href = a.getAttribute('href');
        if (name && href) {
          href = href.replace(/^\/w\/cpp\//, '');
          ctx.pushIndex(`keyword: ${name}`, href);
        }
      }
    });
  }
};
