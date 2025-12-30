
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'mysql',
  name: 'MySQL',
  color: '#F29111',
  testSpec: {
    expectedSymbols: ['SELECT', 'UPDATE', 'ABS', 'JOIN'],
    minEntries: 200
  },
  urlTemplate: 'https://dev.mysql.com/doc/refman/8.4/en/${url}',
  async index(ctx) {
    const baseUrl = 'https://dev.mysql.com/doc/refman/8.4/en/';
    
    // 1. SQL Statements
    const statementsDoc = await ctx.fetchDocument(baseUrl + 'sql-statements.html');
    statementsDoc.querySelectorAll('.toc a').forEach(a => {
      let title = a.textContent.trim().replace(/^\d+(\.\d+)*\s+/, '');
      const href = a.getAttribute('href');
      if (title && href && href !== 'index.html') {
        ctx.pushIndex(title, href);
      }
    });

    // 2. Built-in Functions & Operators (Improved parsing)
    const html = await ctx.fetchText(baseUrl + 'built-in-function-reference.html');
    // Using regex for tables often safer in linkedom if nested tags are complex
    const regex = /<th[^>]*><a[^>]*href="([^"]+)"[^>]*><code[^>]*>([^<]+)<\/code><\/a><\/th>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      ctx.pushIndex(match[2], match[1]);
    }

    // 3. Keywords
    const keywordsDoc = await ctx.fetchDocument(baseUrl + 'keywords.html');
    keywordsDoc.querySelectorAll('td a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href && title.length > 1) {
        ctx.pushIndex(title, href);
      }
    });
  }
};
