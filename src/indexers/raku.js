
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'raku',
  name: 'Raku',
  color: '#ffffff',
  urlTemplate: 'https://docs.raku.org${url}',
  async index(ctx) {
    const baseUrl = 'https://docs.raku.org/';

    // Utility to ensure URL starts with /
    const normalizeUrl = (url) => {
      if (!url) return '';
      return url.startsWith('/') ? url : '/' + url;
    };

    // 1. Index Types
    const typesDoc = await ctx.fetchDocument(baseUrl + 'types');
    typesDoc.querySelectorAll('a[href^="type/"], a[href^="native/"]').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href) {
        ctx.pushIndex(title, normalizeUrl(href));
      }
    });

    // 2. Index Language Reference
    const refDoc = await ctx.fetchDocument(baseUrl + 'reference');
    refDoc.querySelectorAll('a[href^="language/"]').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href) {
        ctx.pushIndex(title, normalizeUrl(href));
      }
    });

    // 3. Index Routines
    const routinesDoc = await ctx.fetchDocument(baseUrl + 'routines');
    const rows = routinesDoc.querySelectorAll('tr');
    
    rows.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 3) {
        const category = tds[0].textContent.trim();
        const name = tds[1].textContent.trim();
        const a = tr.querySelector('a');
        
        if (name && a) {
          const href = a.getAttribute('href');
          ctx.pushIndex(`${name} (${category})`, normalizeUrl(href));
        }
      }
    });
  }
};
