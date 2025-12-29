/**
 * Search Algorithm - ref-old/src/chemr.js からの移植
 */

import type { SearchResultItem, IndexerDefinition } from './types';

/**
 * HTML文字をエスケープ
 */
function escapeHTML(t: string): string {
  return t.replace(/[&<>]/g, (_) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[_] || _));
}

/**
 * 検索イテレータを作成
 * タブ区切りフォーマット: title\turl\n
 */
function createSearchIterator(data: string, query: string | RegExp) {
  const q = new RegExp(typeof query === 'string' ? query : query.source, 'gmi');
  let hasNext = true;

  return {
    hasNext,
    next(): SearchResultItem | null {
      if (!hasNext) {
        return null;
      }

      // by mala http://la.ma.la/blog/diary_200604021538.htm
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
        return line as SearchResultItem;
      } else {
        return this.next();
      }
    }
  };
}

/**
 * ファジー検索を実行
 * @param query 検索クエリ
 * @param data インデックスデータ（タブ区切り形式）
 * @param definition インデクサー定義
 * @returns 検索結果（スコアリング・ソート済み）
 */
export function fuzzySearch(
  query: string,
  data: string,
  definition: Pick<IndexerDefinition, 'beforeSearch' | 'item'>
): SearchResultItem[] {
  // クエリ変換（デフォルト: スペースを .*? に変換）
  const convert = definition.beforeSearch || ((a: string) => a.replace(/\s+/g, '.*?'));
  const convertedQuery = convert(query);

  // 検索実行（最大300件）
  const itr = createSearchIterator(data, convertedQuery);
  const max = 300;
  const results: SearchResultItem[] = [];

  for (let i = 0; i < max; i++) {
    const item = itr.next();
    if (!item) break;
    results.push(item);
  }

  // スコアリング用の正規表現を作成
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

  // スコアリングとハイライト
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

    // インデクサーの item() メソッドを適用
    return definition.item ? definition.item(item) : item;
  });

  // スコアでソート（昇順：低いほど優先）
  scoredResults.sort((a, b) => (a.score || 0) - (b.score || 0));

  return scoredResults;
}
