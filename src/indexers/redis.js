
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'redis',
  name: 'Redis',
  color: '#d82c20',
  testSpec: {
    expectedSymbols: ['GET', 'SET', 'HGET', 'PUBLISH'],
    minEntries: 200
  },
  urlTemplate: 'https://redis.io${url}',
  async index(ctx) {
    const baseUrl = 'https://redis.io/commands/';
    const doc = await ctx.fetchDocument(baseUrl);

    doc.querySelectorAll('article').forEach(article => {
      const link = article.querySelector('a[href*="/commands/"]');
      // The command name is typically in a span with class "truncate"
      const titleEl = article.querySelector('.truncate');
      
      if (link && titleEl) {
        const title = titleEl.textContent.trim();
        const href = link.getAttribute('href');
        if (title && href) {
          ctx.pushIndex(title, href);
        }
      }
    });
  }
};
