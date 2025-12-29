/**
 * Indexer Loader - インデクサーの動的読み込み (ESM)
 */

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { app } from 'electron';
import type { IndexerDefinition } from '../shared/types';

/**
 * 利用可能なインデクサーをすべて読み込む
 */
export async function loadAllIndexers(): Promise<IndexerDefinition[]> {
  const indexers: IndexerDefinition[] = [];

  // アプリケーション内の indexers/ ディレクトリ（ビルド後は out/main/indexers/）
  const builtInIndexersPath = join(__dirname, 'indexers');

  // ユーザーディレクトリの ~/.chemr/indexers/
  const userIndexersPath = join(app.getPath('home'), '.chemr', 'indexers');

  // ビルトインインデクサーを読み込み
  if (existsSync(builtInIndexersPath)) {
    const builtInIndexers = await loadIndexersFromDirectory(builtInIndexersPath);
    indexers.push(...builtInIndexers);
    console.log(`[IndexerLoader] Loaded ${builtInIndexers.length} built-in indexers`);
  }

  // ユーザーインデクサーを読み込み（存在する場合）
  if (existsSync(userIndexersPath)) {
    const userIndexers = await loadIndexersFromDirectory(userIndexersPath);
    indexers.push(...userIndexers);
    console.log(`[IndexerLoader] Loaded ${userIndexers.length} user indexers`);
  }

  return indexers;
}

/**
 * 指定されたディレクトリからインデクサーを読み込む
 */
async function loadIndexersFromDirectory(dirPath: string): Promise<IndexerDefinition[]> {
  const indexers: IndexerDefinition[] = [];

  try {
    const files = readdirSync(dirPath);

    for (const file of files) {
      // .js ファイルのみを対象にする
      if (!file.endsWith('.js')) continue;

      const filePath = join(dirPath, file);
      try {
        const indexer = await loadIndexerFromFile(filePath);
        if (indexer) {
          indexers.push(indexer);
          console.log(`[IndexerLoader] Loaded indexer: ${indexer.id} (${indexer.name})`);
        }
      } catch (error) {
        console.error(`[IndexerLoader] Failed to load ${file}:`, error);
      }
    }
  } catch (error) {
    console.error(`[IndexerLoader] Failed to read directory ${dirPath}:`, error);
  }

  return indexers;
}

/**
 * 単一のインデクサーファイルを読み込む (ESM)
 */
async function loadIndexerFromFile(filePath: string): Promise<IndexerDefinition | null> {
  try {
    // dynamic import を使用して ESM をロード
    const fileUrl = pathToFileURL(filePath).href;
    const module = await import(fileUrl);

    // デフォルトエクスポートを取得
    const indexer = module.default;

    if (!indexer || !indexer.id || !indexer.name || !indexer.index) {
      console.warn(`[IndexerLoader] Invalid indexer format in ${filePath}`);
      return null;
    }

    return indexer as IndexerDefinition;
  } catch (error) {
    console.error(`[IndexerLoader] Error loading ${filePath}:`, error);
    return null;
  }
}

/**
 * 特定のIDのインデクサーを取得
 */
export async function getIndexerById(id: string): Promise<IndexerDefinition | null> {
  const indexers = await loadAllIndexers();
  return indexers.find(indexer => indexer.id === id) || null;
}
