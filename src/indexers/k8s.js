/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'k8s',
  name: 'Kubernetes',
  color: '#326ce5',
  testSpec: {
    expectedSymbols: ['kubectl', 'Pod', 'Architecture'],
    minEntries: 50
  },
  urlTemplate: 'https://kubernetes.io${url}',
  async index(ctx) {
    const baseUrl = 'https://kubernetes.io';

    // 1. kubectl commands
    const kubectlDoc = await ctx.fetchDocument(baseUrl + '/docs/reference/generated/kubectl/kubectl-commands');
    let currentCommand = '';
    kubectlDoc.querySelectorAll('#sidebar-wrapper li').forEach(li => {
      const a = li.querySelector('a');
      const title = a?.textContent.trim();
      const href = a?.getAttribute('href');
      if (!title || !href) return;

      if (li.classList.contains('nav-level-1')) {
        if (title !== title.toUpperCase()) {
          currentCommand = title;
          ctx.pushIndex(`kubectl ${title}`, `/docs/reference/generated/kubectl/kubectl-commands${href}`);
        }
      } else if (li.classList.contains('nav-level-2')) {
        ctx.pushIndex(`kubectl ${currentCommand} ${title}`, `/docs/reference/generated/kubectl/kubectl-commands${href}`);
      }
    });

    // 2. Index documentation using sidebar navigation
    const homeDoc = await ctx.fetchDocument(baseUrl + '/docs/home/');
    homeDoc.querySelectorAll('.td-sidebar-nav a').forEach(a => {
      const title = a.textContent.trim();
      const href = a.getAttribute('href');
      if (title && href && href.startsWith('/docs/')) {
        let prefix = '';
        if (href.includes('/concepts/')) prefix = 'Concept: ';
        else if (href.includes('/tasks/')) prefix = 'Task: ';
        else if (href.includes('/reference/')) prefix = 'Ref: ';
        
        ctx.pushIndex(`${prefix}${title}`, href);
      }
    });
  }
};