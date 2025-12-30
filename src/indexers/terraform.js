
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'terraform',
  name: 'Terraform',
  color: '#7b42bc',
  testSpec: {
    expectedSymbols: ['Language', 'CLI', 'HCP Terraform'],
    minEntries: 50
  },
  urlTemplate: 'https://developer.hashicorp.com${url}',
  async index(ctx) {
    const baseUrl = 'https://developer.hashicorp.com';
    
    // Terraform documentation is dynamic (Next.js) but we can extract links from the sidebars
    // of major entry points.
    const entryPoints = [
      '/terraform/language',
      '/terraform/cli/commands',
      '/terraform/cloud-docs'
    ];

    for (const path of entryPoints) {
      const doc = await ctx.fetchDocument(baseUrl + path);
      
      // Look for navigation links in the sidebar or main content
      doc.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || '';
        const title = a.textContent.trim();

        if (href.startsWith('/terraform/') && title && title.length > 2) {
          // Exclude some common noise
          if (title.includes('HashiCorp') || title === 'Terraform') return;
          
          let prefix = '';
          if (href.includes('/language/')) prefix = 'Lang: ';
          if (href.includes('/cli/commands/')) prefix = 'CLI: ';
          
          ctx.pushIndex(`${prefix}${title}`, href);
        }
      });
    }
  }
};
