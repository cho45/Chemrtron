/**
 * IPC Handlers - Renderer ↔ Main プロセス間通信
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, type SerializableIndexerMetadata, type IndexerDefinition } from '../shared/types';
import * as CacheManager from './cache-manager';
import { getIndexerById } from './indexer-loader';
import { createIndexerContext } from './indexer-context';

/**
 * IPC handlersを登録
 */
export function setupIpcHandlers(): void {
  // インデックスデータを取得
  ipcMain.handle(IPC_CHANNELS.GET_INDEX, async (_event, args: { id: string; reindex?: boolean }) => {
    const { id, reindex } = args;

    try {
      // インデクサーをロードしてメタデータを作成
      const indexer = await getIndexerById(id);
      if (!indexer) {
        throw new Error(`Indexer not found: ${id}`);
      }
      const indexerMetadata = serializeIndexerMetadata(indexer);

      // reindex=true の場合はキャッシュを削除して再作成
      if (reindex) {
        CacheManager.deleteCache(id);
      }

      // キャッシュが存在する場合は読み込み
      if (CacheManager.hasCache(id)) {
        const { data, metadata } = CacheManager.getIndex(id);
        console.log(`[IPC] Loaded index from cache for ${id}`, metadata);
        return { data, metadata, indexerMetadata };
      } else {
        // キャッシュがない場合はインデクサーを実行してインデックスを作成
        console.log(`[IPC] No cache for ${id}, creating index...`);
        const indexData = await createIndex(id, indexer);
        return { data: indexData, metadata: null, indexerMetadata };
      }
    } catch (error) {
      console.error(`[IPC] Error getting index for ${id}:`, error);
      throw error;
    }
  });

  console.log('[IPC] Handlers registered');
}

/**
 * IndexerDefinitionをシリアライズ可能な形式に変換
 */
function serializeIndexerMetadata(indexer: IndexerDefinition): SerializableIndexerMetadata {
  return {
    id: indexer.id,
    name: indexer.name,
    color: indexer.color,
    icon: indexer.icon,
    urlTemplate: indexer.urlTemplate,
    css: indexer.css
  };
}

/**
 * インデクサーを実行してインデックスを作成
 */
async function createIndex(id: string, indexer: IndexerDefinition): Promise<string> {
  console.log(`[IPC] Creating index for ${id}...`);
  console.log(`[IPC] Using indexer: ${indexer.name}`);

  // IndexerContext を作成
  const ctx = createIndexerContext();

  // インデクサーを実行
  await indexer.index(ctx);

  // インデックスデータを取得
  const indexData = ctx.getIndexData();
  console.log(`[IPC] Index created: ${indexData.split('\n').length - 2} entries`);

  // キャッシュに保存
  CacheManager.saveIndex(id, indexData, {
    id: indexer.id,
    name: indexer.name,
    version: '1.0.0',
    created: Date.now()
  });

  console.log(`[IPC] Index saved to cache for ${id}`);

  return indexData;
}
