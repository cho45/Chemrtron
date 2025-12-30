
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'man',
  name: 'Man Pages',
  color: '#000000',
  urlTemplate: 'https://man7.org/linux/man-pages/${url}',
  async index(ctx) {
    const baseUrl = 'https://man7.org/linux/man-pages/';
    const doc = await ctx.fetchDocument(baseUrl + 'dir_all_alphabetic.html');

    // Man pages are listed in <pre> tags as <a> links.
    // Example: <a href="./man3/abort.3.html">abort(3)</a>
    doc.querySelectorAll('pre a').forEach(a => {
      const title = a.textContent.trim();
      let href = a.getAttribute('href');
      
      // Filter out jump links like "top"
      if (title && href && !href.startsWith('#')) {
        // Normalize href (remove leading ./)
        const normalizedHref = href.replace(/^\.\//, '');
        ctx.pushIndex(title, normalizedHref);
      }
    });
  }
};
