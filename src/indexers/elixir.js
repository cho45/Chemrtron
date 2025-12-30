
/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'elixir',
  name: 'Elixir',
  color: '#4e2a8e',
  testSpec: {
    expectedSymbols: ['Kernel.abs', 'Enum.map', 'String.trim'],
    minEntries: 500
  },
  urlTemplate: 'https://hexdocs.pm/elixir/${url}',
  async index(ctx) {
    const baseUrl = 'https://hexdocs.pm/elixir/';
    // Elixir docs redirect to Kernel.html (usually)
    const doc = await ctx.fetchDocument(baseUrl + 'Kernel.html');
    const script = doc.querySelector('script[src^="dist/sidebar_items-"]');
    if (!script) return;

    const scriptUrl = baseUrl + script.getAttribute('src');
    const content = await ctx.fetchText(scriptUrl);
    
    // The file content is "sidebarNodes={...}"
    const jsonStr = content.replace(/^sidebarNodes=/, '');
    const data = JSON.parse(jsonStr);

    if (data.modules) {
      data.modules.forEach(module => {
        const moduleTitle = module.title;
        const moduleFile = module.id + '.html';
        
        ctx.pushIndex(moduleTitle, moduleFile);

        if (module.nodeGroups) {
          module.nodeGroups.forEach(group => {
            if (group.nodes) {
              group.nodes.forEach(node => {
                const title = `${moduleTitle}.${node.id}`;
                const href = `${moduleFile}#${node.anchor}`;
                ctx.pushIndex(title, href);
              });
            }
          });
        }
      });
    }
    
    // Also check for extras (guides, etc.)
    if (data.extras) {
      data.extras.forEach(extra => {
        if (extra.nodes) {
          extra.nodes.forEach(node => {
            ctx.pushIndex(node.title, node.id + '.html');
          });
        }
      });
    }
  }
};
