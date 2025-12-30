/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'git',
  name: 'Git',
  color: '#f05032',
  urlTemplate: 'https://git-scm.com${url}',
  async index(ctx) {
    const baseUrl = 'https://git-scm.com/docs';
    const doc = await ctx.fetchDocument(baseUrl);

    doc.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const title = a.textContent.trim();

      if (href.startsWith('/docs/') && title) {
        // Handle git command pages (e.g., /docs/git-add)
        if (href.startsWith('/docs/git-')) {
          const commandName = href.replace('/docs/git-', ''); // e.g., "add"
          
          ctx.pushIndex(`git ${commandName}`, href);
          ctx.pushIndex(`git-${commandName}`, href);
          ctx.pushIndex(commandName, href);
          
          // If the link text was something else (like "add"), index that too
          if (title !== commandName && title !== `git ${commandName}` && title !== `git-${commandName}`) {
            ctx.pushIndex(title, href);
          }
        } else if (title.length > 3 && !href.includes('#')) {
          // General documentation pages
          ctx.pushIndex(title, href);
        }
      }
    });
  }
};