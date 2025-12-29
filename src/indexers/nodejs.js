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

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    const data = await ctx.fetchJSON('https://nodejs.org/api/all.json');

    // 補助関数: 再帰的に要素をスキャン
    const scan = (obj, filename) => {
      if (!obj) return;

      if (obj.textRaw && filename) {
        const name = obj.textRaw.replace(/<[^>]*>/g, '');
        const anchor = obj.name ? obj.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
        const url = anchor ? `${filename}#${anchor}` : filename;
        ctx.pushIndex(name, url);
      }

      // 子要素を再帰的にスキャン
      const childrenKeys = ['globals', 'miscs', 'modules', 'classes', 'methods', 'properties', 'events', 'vars', 'signatures'];
      for (const key of childrenKeys) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            scan(item, filename || (obj.name ? `${obj.name}.html` : ''));
          }
        }
      }
    };

    // ルートレベルの要素をスキャン
    if (data.globals) data.globals.forEach(item => scan(item, 'globals.html'));
    if (data.miscs) data.miscs.forEach(item => scan(item, 'documentation.html'));
    if (data.modules) data.modules.forEach(item => scan(item, item.name ? `${item.name}.html` : ''));
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
