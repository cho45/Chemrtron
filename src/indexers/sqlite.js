
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'sqlite',
  name: 'SQLite',
  color: '#003b57',
  async index(ctx) {
    const baseUrl = 'https://www.sqlite.org/';

    // 1. Index from Keyword Index
    // This page contains a comprehensive list of SQL keywords, functions, pragmas, and concepts.
    const keywordUrl = baseUrl + 'keyword_index.html';
    const keywordDoc = await ctx.fetchDocument(keywordUrl);
    keywordDoc.querySelectorAll('li a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href && !href.startsWith('javascript:') && !href.startsWith('index.html')) {
        const absoluteUrl = new URL(href, keywordUrl).href;
        ctx.pushIndex(title, absoluteUrl);
      }
    });

    // 2. Index from C API Function List
    const funcListUrl = baseUrl + 'c3ref/funclist.html';
    const funcDoc = await ctx.fetchDocument(funcListUrl);
    funcDoc.querySelectorAll('li a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href && title.startsWith('sqlite3_')) {
        const absoluteUrl = new URL(href, funcListUrl).href;
        ctx.pushIndex(title, absoluteUrl);
      }
    });
  }
};
