
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'ruby',
  name: 'Ruby',
  color: '#cc342d',
  testSpec: {
    expectedSymbols: ['Array', 'Enumerable', 'reduce'],
    minEntries: 1000
  },
  urlTemplate: 'https://ruby-doc.org/3.4.1/${url}',
  async index(ctx) {
    const baseUrl = 'https://ruby-doc.org/3.4.1/';
    const text = await ctx.fetchText(baseUrl + 'js/search_index.js');

    // Extract JSON from "var search_data = { ... }"
    const jsonMatch = text.match(/var search_data = ([\s\S]+?)$/);
    if (!jsonMatch) return;

    let jsonText = jsonMatch[1].trim();
    if (jsonText.endsWith(';')) {
      jsonText = jsonText.slice(0, -1);
    }

    const data = JSON.parse(jsonText);
    const info = data.index.info;

    for (const entry of info) {
      const [name, container, href, args, desc] = entry;
      // Use "Container#name" for classes/methods
      const title = container ? `${container}#${name}` : name;
      
      // href might start with "./", normalize it
      const normalizedHref = href.startsWith('./') ? href.slice(2) : href;
      
      ctx.pushIndex(title, normalizedHref);
    }
  }
};
