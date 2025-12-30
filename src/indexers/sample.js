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
    ctx.progress('init', 0, 100);
    // 初期化のシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));

    // サンプルデータをインデックスに追加
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
      { title: 'Best Practices', url: 'best-practices' },
      { title: 'Contributing Guide', url: 'contributing' },
      { title: 'Security Policy', url: 'security' },
      { title: 'Release Notes v2.0', url: 'releases/v2.0' },
      { title: 'Release Notes v1.5', url: 'releases/v1.5' },
      { title: 'CLI Tool Documentation', url: 'cli-docs' },
      { title: 'Plugin Development', url: 'plugins' },
      { title: 'Deployment Strategies', url: 'deployment' },
      { title: 'Performance Optimization', url: 'performance' },
      { title: 'Monitoring and Logging', url: 'monitoring' },
      { title: 'Community Resources', url: 'community' }
    ];

    const total = sampleData.length;
    ctx.progress('crawl.start', 0, total);

    for (let i = 0; i < total; i++) {
      const item = sampleData[i];
      ctx.pushIndex(item.title, item.url);
      
      // 各アイテムの処理を遅延させてプログレス表示を確認しやすくする
      ctx.progress('crawl.progress', i + 1, total);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    ctx.progress('done', total, total);
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
