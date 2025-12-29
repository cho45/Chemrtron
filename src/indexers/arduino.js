/**
 * Arduino Language Reference Indexer
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const arduinoIndexer = {
  id: 'arduino',
  name: 'Arduino',
  color: '#00979C',

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const url = 'https://docs.arduino.cc/language-reference/';
    const doc = await ctx.fetchDocument(url);

    // Get all links that look like language reference links
    // Based on the observation, they are in the main content area
    const links = doc.querySelectorAll('a[href*="/language-reference/en/"]');
    const seen = new Set();

    for (const link of links) {
      const title = link.textContent.trim();
      const href = link.getAttribute('href');

      if (title && href && !seen.has(href)) {
        // Skip common navigation links if necessary, but here we just push what we find
        ctx.pushIndex(title, href);
        seen.add(href);
      }
    }
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://docs.arduino.cc${url}'
};

export default arduinoIndexer;
