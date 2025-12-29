/**
 * Sample Indexer - テスト用の最小限のインデクサー
 * 外部アクセスなし、setTimeout で非同期処理をシミュレート
 *
 * @type {import('../shared/types').IndexerDefinition}
 */
const sampleIndexer = {
  id: 'sample',
  name: 'Sample Documentation',
  color: '#4CAF50',

  /**
   * インデックスを作成
   * @param {import('../shared/types').IndexerContext} ctx
   */
  async index(ctx) {
    // setTimeout で非同期処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 100));

    // サンプルデータをインデックスに追加
    // インデックスサイズを削減するため、共通prefix（https://example.com/docs/）は保存しない
    const sampleData = [
      { title: 'Getting Started', url: 'getting-started' },
      { title: 'API Reference', url: 'api-reference' },
      { title: 'Tutorial: Hello World', url: 'tutorial-hello-world' },
      { title: 'Tutorial: Advanced Topics', url: 'tutorial-advanced' },
      { title: 'Configuration Guide', url: 'configuration' },
      { title: 'Troubleshooting', url: 'troubleshooting' },
      { title: 'FAQ', url: 'faq' },
      { title: 'Installation', url: 'installation' },
      { title: 'Migration Guide', url: 'migration' },
      { title: 'Best Practices', url: 'best-practices' }
    ];

    for (const item of sampleData) {
      ctx.pushIndex(item.title, item.url);
      // 各アイテムの追加を遅延させて非同期処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  },

  /**
   * URLテンプレート（共通prefixを付与）
   */
  urlTemplate: 'https://example.com/docs/${url}',

  /**
   * カスタムCSS
   */
  css: `
    body {
      font-family: system-ui, -apple-system, sans-serif;
    }
    h1 {
      color: #4CAF50;
    }
  `
};

export default sampleIndexer;
