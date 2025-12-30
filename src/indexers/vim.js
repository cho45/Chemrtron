
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'vim',
  name: 'Vim',
  color: '#19912b',
  urlTemplate: 'https://vimhelp.org/${url}',
  async index(ctx) {
    const baseUrl = 'https://vimhelp.org/';
    const doc = await ctx.fetchDocument(baseUrl + 'tags.html');

    // Vim tags are listed in a <pre> block.
    // Each entry has an <a> tag with class "d".
    // The first <a> on each line is the tag, the second is the file.
    doc.querySelectorAll('pre a.d').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      
      // Filter out links that look like file names (ending in .txt)
      // and keep the actual tags.
      if (title && href && !title.endsWith('.txt')) {
        ctx.pushIndex(title, href);
      }
    });
  }
};
