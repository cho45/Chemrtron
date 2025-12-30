
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'postgresql',
  name: 'PostgreSQL',
  color: '#336791',
  testSpec: {
    expectedSymbols: ['SELECT', 'CREATE TABLE', 'JSON', 'vacuum'],
    minEntries: 500
  },
  urlTemplate: 'https://www.postgresql.org/docs/current/${url}',
  async index(ctx) {
    const baseUrl = 'https://www.postgresql.org/docs/current/';
    const doc = await ctx.fetchDocument(baseUrl + 'bookindex.html');

    doc.querySelectorAll('dt').forEach(dt => {
      const links = dt.querySelectorAll('a.indexterm');
      if (links.length === 0) return;

      // Try to get the text before the links (the main keyword)
      let mainText = '';
      if (dt.firstChild && dt.firstChild.nodeType === 3) { // Node.TEXT_NODE
        mainText = dt.firstChild.textContent.trim();
        if (mainText.endsWith(',')) {
          mainText = mainText.slice(0, -1).trim();
        }
      }

      links.forEach(link => {
        const context = link.textContent.trim();
        const href = link.getAttribute('href');
        if (!href) return;

        // Construct a descriptive title
        let title = mainText;
        if (mainText && context && mainText !== context) {
          title = `${mainText} — ${context}`;
        } else {
          title = mainText || context;
        }

        ctx.pushIndex(title, href);
      });
    });
  }
};
