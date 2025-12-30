
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'docker',
  name: 'Docker',
  color: '#2496ed',
  urlTemplate: 'https://docs.docker.com${url}',
  async index(ctx) {
    const baseUrl = 'https://docs.docker.com';
    const doc = await ctx.fetchDocument(baseUrl + '/reference/');

    // Docker docs have a sidebar with class "ml-3" items under Reference
    // We can also find links in the main content cards.
    
    // 1. Index from sidebar (nested structure)
    doc.querySelectorAll('ul.ml-3 a').forEach(a => {
      const title = a.textContent.trim();
      let href = a.getAttribute('href');
      if (title && href) {
        // Normalize href
        if (!href.startsWith('http')) {
          href = href.startsWith('/') ? href : '/reference/' + href;
        } else {
          href = href.replace(baseUrl, '');
        }
        ctx.pushIndex(title, href);
      }
    });

    // 2. Explicitly include major references if not captured
    const majorRefs = [
      { title: 'Dockerfile reference', href: '/reference/dockerfile/' },
      { title: 'Compose file reference', href: '/reference/compose-file/' },
      { title: 'Docker CLI reference', href: '/reference/cli/docker/' },
      { title: 'Docker Engine API', href: '/reference/api/engine/' }
    ];

    majorRefs.forEach(ref => {
      ctx.pushIndex(ref.title, ref.href);
    });
  }
};
