/**
 * 検索アルゴリズムの簡易テスト
 */

import { fuzzySearch } from '../src/shared/search-algorithm';
import type { IndexerDefinition } from '../src/shared/types';

// サンプルデータ
const sampleData = `
Array	Web/JavaScript/Reference/Global_Objects/Array
Array.prototype.map()	Web/JavaScript/Reference/Global_Objects/Array/map
Array.prototype.filter()	Web/JavaScript/Reference/Global_Objects/Array/filter
Array.prototype.reduce()	Web/JavaScript/Reference/Global_Objects/Array/reduce
Promise	Web/JavaScript/Reference/Global_Objects/Promise
async function	Web/JavaScript/Reference/Statements/async_function
fetch()	Web/API/fetch
`.trim();

// MDNインデクサー定義相当の設定
const mdnIndexer: Pick<IndexerDefinition, 'urlTemplate'> = {
  urlTemplate: 'https://developer.mozilla.org/en-US/docs/${url}'
};

// テスト実行
console.log('=== Search Algorithm Test ===\n');

console.log('Test 1: Search for "array"');
const results1 = fuzzySearch('array', sampleData, mdnIndexer);
console.log(`Found ${results1.length} results:`);
results1.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r[0]} (score: ${r.score})`);
  console.log(`     URL: ${r[1]}`);
  console.log(`     HTML: ${r[2]}`);
});

console.log('\nTest 2: Search for "map"');
const results2 = fuzzySearch('map', sampleData, mdnIndexer);
console.log(`Found ${results2.length} results:`);
results2.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r[0]} (score: ${r.score})`);
});

console.log('\nTest 3: Fuzzy search "arr fil"');
const results3 = fuzzySearch('arr fil', sampleData, mdnIndexer);
console.log(`Found ${results3.length} results:`);
results3.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r[0]} (score: ${r.score})`);
  console.log(`     HTML: ${r[2]}`);
});

console.log('\n✅ All tests completed!');