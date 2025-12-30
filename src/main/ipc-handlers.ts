/**
 * IPC Handlers - Renderer ↔ Main プロセス間通信
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, type SerializableIndexerMetadata, type IndexerDefinition, type Settings } from '../shared/types';
import * as CacheManager from './cache-manager';
import { getIndexerById, loadAllIndexers } from './indexer-loader';
import { createIndexerContext } from './indexer-context';
import * as SettingsManager from './settings-manager';

/**
 * IPC handlersを登録
 */
export function setupIpcHandlers(): void {
  // 全インデクサーリストを取得
  ipcMain.handle(IPC_CHANNELS.GET_ALL_INDEXERS, async () => {
    try {
      const indexers = await loadAllIndexers();
      return indexers.map(serializeIndexerMetadata);
    } catch (error) {
      console.error('[IPC] Error getting all indexers:', error);
      throw error;
    }
  });

  // 設定を取得
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    try {
      return SettingsManager.loadSettings();
    } catch (error) {
      console.error('[IPC] Error getting settings:', error);
      throw error;
    }
  });

  // 設定を更新
  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_event, settings: Settings) => {
    try {
      SettingsManager.saveSettings(settings);
      console.log('[IPC] Settings updated:', settings);
      return true;
    } catch (error) {
      console.error('[IPC] Error updating settings:', error);
      throw error;
    }
  });
  // インデックスデータを取得
  ipcMain.handle(IPC_CHANNELS.GET_INDEX, async (event, args: { id: string; reindex?: boolean }) => {
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
        const indexData = await createIndex(id, indexer, event);
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
async function createIndex(id: string, indexer: IndexerDefinition, event?: Electron.IpcMainInvokeEvent): Promise<string> {
  console.log(`[IPC] Creating index for ${id}...`);
  console.log(`[IPC] Using indexer: ${indexer.name}`);

  // 進捗コールバック
  const progressCallback = (state: string, current: number, total: number) => {
    console.log(`[IPC] Progress: ${state} ${current}/${total}`);
    if (event) {
      event.sender.send(IPC_CHANNELS.PROGRESS, { id, state, current, total });
    }
  };

  // IndexerContext を作成
  const ctx = createIndexerContext(progressCallback);

  // 初期進捗を送信
  progressCallback('init', 0, 1);

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

  // 完了を送信
  progressCallback('done', 1, 1);

  // UIで完了メッセージが見えるように少し待つ
  await new Promise((resolve) => setTimeout(resolve, 500));

  return indexData;
}
