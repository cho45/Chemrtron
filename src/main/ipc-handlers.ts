/**
 * IPC Handlers - Renderer ↔ Main プロセス間通信
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import * as CacheManager from './cache-manager';

/**
 * IPC handlersを登録
 */
export function setupIpcHandlers(): void {
  // インデックスデータを取得
  ipcMain.handle(IPC_CHANNELS.GET_INDEX, async (_event, args: { id: string; reindex?: boolean }) => {
    const { id, reindex } = args;

    try {
      // reindex=true の場合はキャッシュを削除して再作成（MVP段階では未実装）
      if (reindex) {
        CacheManager.deleteCache(id);
      }

      // キャッシュが存在する場合は読み込み
      if (CacheManager.hasCache(id)) {
        const { data, metadata } = CacheManager.getIndex(id);
        console.log(`[IPC] Loaded index for ${id}`, metadata);
        return { data, metadata };
      } else {
        // キャッシュがない場合（MVP段階ではサンプルデータを返す）
        console.log(`[IPC] No cache for ${id}, returning sample data`);
        const sampleData = createSampleData(id);
        return { data: sampleData, metadata: null };
      }
    } catch (error) {
      console.error(`[IPC] Error getting index for ${id}:`, error);
      throw error;
    }
  });

  console.log('[IPC] Handlers registered');
}

/**
 * サンプルデータを作成（MVP用）
 */
function createSampleData(id: string): string {
  if (id === 'mdn') {
    return `\nArray\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
Array.prototype.map()\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
Array.prototype.filter()\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
Array.prototype.reduce()\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
Promise\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
async function\thttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
fetch()\thttps://developer.mozilla.org/en-US/docs/Web/API/fetch
`;
  }
  return '\n';
}
