/** @type {import('../shared/types').IndexerDefinition} */
export default {
  id: 'cmake',
  name: 'CMake',
  color: '#064f8c',
  testSpec: {
    expectedSymbols: ['add_executable', 'target_link_libraries', 'PROJECT_SOURCE_DIR'],
    minEntries: 500
  },
  urlTemplate: 'https://cmake.org/cmake/help/latest/${url}',
  async index(ctx) {
    const baseUrl = 'https://cmake.org/cmake/help/latest/';
    const doc = await ctx.fetchDocument(baseUrl + 'genindex.html');

    // Sphinx genindex contains list items with links.
    // Some are simple: <li><a href="...">add_executable</a></li>
    // Some are nested: <li>variable
    //                    <ul><li><a href="...">CMAKE_CXX_FLAGS</a></li></ul>
    //                  </li>
    doc.querySelectorAll('table.indextable a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;

      const title = a.textContent.trim();
      
      // If the link is inside a nested list, it might be a sub-item.
      // We can check the parent <li>'s text to get more context if needed,
      // but for CMake, the link text itself is usually the command/variable name.
      
      if (title) {
        ctx.pushIndex(title, href);
      }
    });
  }
};