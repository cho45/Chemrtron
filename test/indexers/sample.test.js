/**
 * Sample Indexer のテスト
 */

// ESM import を使用
import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// サンプルインデクサーをインポート
const sampleIndexerPath = join(__dirname, '../../src/indexers/sample.js');
const sampleIndexerModule = await import(pathToFileURL(sampleIndexerPath).href);
const sampleIndexer = sampleIndexerModule.default;

// モックの IndexerContext を作成
function createMockContext() {
  const indexEntries = [];

  return {
    entries: indexEntries,
    pushIndex(title, url) {
      indexEntries.push({ title, url });
    },
    async fetchDocument(url) {
      throw new Error('fetchDocument is not implemented in mock');
    },
    async fetchJSON(url) {
      throw new Error('fetchJSON is not implemented in mock');
    },
    async fetchText(url) {
      throw new Error('fetchText is not implemented in mock');
    },
    async crawl(urls, callback) {
      throw new Error('crawl is not implemented in mock');
    }
  };
}

// テスト実行
async function runTests() {
  console.log('=== Sample Indexer Tests ===\n');

  // Test 1: インデクサーの基本プロパティ
  console.log('Test 1: インデクサーの基本プロパティ');
  assert.strictEqual(sampleIndexer.id, 'sample', 'id should be "sample"');
  assert.strictEqual(sampleIndexer.name, 'Sample Documentation', 'name should be "Sample Documentation"');
  assert.strictEqual(sampleIndexer.color, '#4CAF50', 'color should be "#4CAF50"');
  assert.strictEqual(typeof sampleIndexer.index, 'function', 'index should be a function');
  assert.strictEqual(typeof sampleIndexer.item, 'function', 'item should be a function');
  assert.strictEqual(typeof sampleIndexer.CSS, 'function', 'CSS should be a function');
  console.log('✓ Pass\n');

  // Test 2: index() メソッドがインデックスを作成する
  console.log('Test 2: index() メソッドがインデックスを作成する');
  const ctx = createMockContext();
  await sampleIndexer.index(ctx);
  assert.ok(ctx.entries.length > 0, 'Should have created at least one index entry');
  assert.ok(ctx.entries.length === 10, 'Should have created 10 index entries');
  console.log(`✓ Pass - Created ${ctx.entries.length} entries\n`);

  // Test 3: インデックスエントリの内容確認
  console.log('Test 3: インデックスエントリの内容確認');
  const firstEntry = ctx.entries[0];
  assert.ok(firstEntry.title, 'Entry should have a title');
  assert.ok(firstEntry.url, 'Entry should have a URL');
  assert.ok(firstEntry.url.startsWith('https://'), 'URL should start with https://');
  console.log(`✓ Pass - First entry: "${firstEntry.title}" -> ${firstEntry.url}\n`);

  // Test 4: item() メソッドの動作確認
  console.log('Test 4: item() メソッドの動作確認');
  const testItem = ['Test Title', 'https://example.com/test'];
  const result = sampleIndexer.item(testItem);
  assert.strictEqual(result[0], 'Test Title', 'Title should not be modified');
  assert.strictEqual(result[1], 'https://example.com/test', 'URL should not be modified');
  console.log('✓ Pass\n');

  // Test 5: CSS() メソッドの動作確認
  console.log('Test 5: CSS() メソッドの動作確認');
  const css = sampleIndexer.CSS();
  assert.ok(typeof css === 'string', 'CSS should return a string');
  assert.ok(css.length > 0, 'CSS should not be empty');
  assert.ok(css.includes('#4CAF50'), 'CSS should contain the color');
  console.log('✓ Pass\n');

  // Test 6: すべてのエントリを表示
  console.log('Test 6: すべてのインデックスエントリ');
  ctx.entries.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.title} -> ${entry.url}`);
  });
  console.log('');

  console.log('=== All Tests Passed! ===');
}

// テスト実行
runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
