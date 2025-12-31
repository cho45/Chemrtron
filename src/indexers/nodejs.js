/**
 * Node.js API Indexer
 * Uses nodejs.org/api/all.json to build the index.
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const nodejsIndexer = {
  id: 'nodejs',
  name: 'Node.js',
  color: '#339933',
  testSpec: {
    expectedSymbols: ['fs', 'http', 'process', 'Buffer'],
    minEntries: 500
  },

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const data = await ctx.fetchJSON('https://nodejs.org/api/all.json');

    // 補助関数: 再帰的に要素をスキャン
    const scan = (obj, parentFilename) => {
      if (!obj) return;

      // Determine the filename for this object.
      // If it has a 'source', that defines the filename.
      // Otherwise, use the parent's filename.
      let currentFilename = parentFilename;
      if (obj.source) {
        currentFilename = obj.source.replace(/^doc\/api\//, '').replace(/\.md$/, '.html');
      }

      if (obj.textRaw && currentFilename) {
        const name = obj.textRaw.replace(/<[^>]*>/g, '');
        // Modern Node.js anchor generation:
        const anchor = name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        const url = anchor ? `${currentFilename}#${anchor}` : currentFilename;
        ctx.pushIndex(name, url);
      }

      // 子要素を再帰的にスキャン
      const childrenKeys = ['globals', 'miscs', 'modules', 'classes', 'methods', 'properties', 'events', 'vars', 'signatures'];
      for (const key of childrenKeys) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            scan(item, currentFilename);
          }
        }
      }
    };

    // ルートレベルの要素をスキャン
    // globals, miscs, modules などの最上位要素は source を持っているため、
    // scan 内部で正しいファイル名が決定される。
    if (data.globals) data.globals.forEach(item => scan(item, 'globals.html'));
    if (data.miscs) data.miscs.forEach(item => scan(item, 'documentation.html'));
    if (data.modules) data.modules.forEach(item => scan(item, ''));
    if (data.classes) data.classes.forEach(item => scan(item, ''));
  },

  /**
   * URLテンプレート
   */
  urlTemplate: 'https://nodejs.org/api/${url}',

  /**
   * カスタムCSS
   */
  css: `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #fff;
      color: #333;
    }
    #apicontent {
      padding: 1em;
    }
    code {
      background-color: rgba(0,0,0,0.05);
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      overflow: auto;
    }
  `
};

export default nodejsIndexer;
