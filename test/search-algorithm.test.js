/**
 * 検索アルゴリズムの簡易テスト
 */

// CommonJS形式で読み込めるようにする
const fs = require('fs');
const path = require('path');

// ビルド済みのコードを読み込み
const searchModulePath = path.join(__dirname, '../out/main/index.js');

// サンプルデータ
const sampleData = `
Array\tWeb/JavaScript/Reference/Global_Objects/Array
Array.prototype.map()\tWeb/JavaScript/Reference/Global_Objects/Array/map
Array.prototype.filter()\tWeb/JavaScript/Reference/Global_Objects/Array/filter
Array.prototype.reduce()\tWeb/JavaScript/Reference/Global_Objects/Array/reduce
Promise\tWeb/JavaScript/Reference/Global_Objects/Promise
async function\tWeb/JavaScript/Reference/Statements/async_function
fetch()\tWeb/API/fetch
`;

// MDNインデクサー定義
const mdnIndexer = {
  id: 'mdn',
  name: 'MDN',
  item: (item) => {
    item[1] = 'https://developer.mozilla.org/en-US/docs/' + item[1];
    return item;
  }
};

// 検索関数を手動でインポート（TypeScriptビルド後のコードから）
// ここでは直接実装をコピー
function escapeHTML(t) {
  return t.replace(/[&<>]/g, (_) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[_] || _));
}

function createSearchIterator(data, query) {
  const q = new RegExp(typeof query === 'string' ? query : query.source, 'gmi');
  let hasNext = true;

  return {
    hasNext,
    next() {
      if (!hasNext) {
        return null;
      }

      const match = q.exec(data);
      if (!match) {
        hasNext = false;
        return null;
      }

      const start = data.lastIndexOf('\n', match.index) + 1;
      const tab = data.lastIndexOf('\t', match.index) + 1;
      let end = data.indexOf('\n', start);
      if (end === -1) end = data.length - 1;
      q.lastIndex = end + 1;

      if (data.length - 1 <= end + 1) {
        hasNext = false;
      }

      if (start > tab) {
        const line = data.slice(start, end).split('\t');
        return line;
      } else {
        return this.next();
      }
    }
  };
}

function fuzzySearch(query, data, definition) {
  const convert = definition.beforeSearch || ((a) => a.replace(/\s+/g, '.*?'));
  const convertedQuery = convert(query);

  const itr = createSearchIterator(data, convertedQuery);
  const max = 300;
  const results = [];

  for (let i = 0; i < max; i++) {
    const item = itr.next();
    if (!item) break;
    results.push(item);
  }

  const regex = new RegExp(
    query
      .replace(/\s+/g, '')
      .split('')
      .map((c) => {
        c = c.replace(/\W/g, '\\$&');
        return '([^' + c + ']*)(' + c + ')?';
      })
      .join(''),
    'i'
  );

  const scoredResults = results.map((item) => {
    const str = item[0];
    const matched = regex.exec(str);

    if (matched) {
      let matchCount = 0;
      let formatted = '';

      for (let i = 1, len = matched.length; i < len; i += 2) {
        if (matched[i]) {
          formatted += escapeHTML(matched[i]);
        }
        if (matched[i + 1]) {
          matchCount++;
          formatted += '<b>' + escapeHTML(matched[i + 1]) + '</b>';
        }
      }
      formatted += escapeHTML(str.slice(matched[0].length));

      const score = str.length - matchCount;
      item[2] = formatted;
      item.score = score;
    } else {
      item[2] = str;
      item.score = str.length * 100;
    }

    return definition.item ? definition.item(item) : item;
  });

  scoredResults.sort((a, b) => (a.score || 0) - (b.score || 0));

  return scoredResults;
}

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
