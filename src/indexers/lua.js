/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'lua',
  name: 'Lua',
  color: '#000080',
  urlTemplate: 'https://www.lua.org/manual/5.4/${url}',
  async index(ctx) {
    const baseUrl = 'https://www.lua.org/manual/5.4/';
    const html = await ctx.fetchText(baseUrl);
    
    // Final solution for Lua: Use regex to extract links directly from HTML
    // because the site uses HTML 4.01 with upper-case tags and attributes (HREF),
    // which some DOM parsers might struggle with in strict mode.
    const seen = new Set();
    const linkRegex = /<A\s+HREF="(manual\.html#[^"]+)"[^>]*>([^<]+)<\/A>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      if (title && !/^\d+(\.\d+)*$/.test(title)) {
        if (!seen.has(href)) {
          ctx.pushIndex(title, href);
          seen.add(href);
        }
      }
    }
  }
};