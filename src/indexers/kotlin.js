
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'kotlin',
  name: 'Kotlin Standard Library',
  color: '#7F52FF',
  testSpec: {
    expectedSymbols: ['String', 'Collections', 'ranges'],
    minEntries: 500
  },
  urlTemplate: 'https://kotlinlang.org/api/core/kotlin-stdlib/${url}',
  async index(ctx) {
    const baseUrl = 'https://kotlinlang.org/api/core/kotlin-stdlib/';
    const doc = await ctx.fetchDocument(baseUrl + 'navigation.html');

    doc.querySelectorAll('a.toc--link').forEach(a => {
      // Clean up the title from <span> and <wbr> tags
      const title = a.textContent.replace(/\s+/g, ' ').trim();
      const href = a.getAttribute('href');
      
      if (title && href) {
        // Most links in navigation.html are relative to navigation.html itself.
        // If it starts with '../', we might need to handle it, but pushIndex 
        // usually expects a path relative to the base defined in urlTemplate.
        // However, if we set the base carefully, it works.
        ctx.pushIndex(title, href);
      }
    });
  }
};
