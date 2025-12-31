/**
 * Indexer Loader - インデクサーの動的読み込み (ESM)
 */

import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import os from 'os';
import type { IndexerDefinition } from '../shared/types';

const CHEM_DIR = join(os.homedir(), '.chemr');
const BUILTIN_INDEXERS_PATH = join(CHEM_DIR, 'builtin-indexers');
const USER_INDEXERS_PATH = join(CHEM_DIR, 'indexers');

/**
 * アプリ内蔵のインデクサーを ~/.chemr/builtin-indexers/ に同期する
 */
export function syncBuiltinIndexers(): void {
  // 同期先ディレクトリの確保
  if (!existsSync(BUILTIN_INDEXERS_PATH)) {
    mkdirSync(BUILTIN_INDEXERS_PATH, { recursive: true });
  }

  // アプリケーション内のインデクサーを探す (ビルド後は out/main/indexers/)
  let sourceDir = '';
  let currentSearchDir = __dirname;
  for (let i = 0; i < 3; i++) {
    const target = join(currentSearchDir, 'indexers');
    if (existsSync(target)) {
      sourceDir = target;
      break;
    }
    currentSearchDir = join(currentSearchDir, '..');
  }

  if (!sourceDir) {
    console.error(`[IndexerLoader] Built-in indexers source directory not found near ${__dirname}`);
    return;
  }

  try {
    const files = readdirSync(sourceDir);
    let count = 0;
    for (const file of files) {
      if (file.endsWith('.js')) {
        const content = readFileSync(join(sourceDir, file));
        writeFileSync(join(BUILTIN_INDEXERS_PATH, file), content);
        count++;
      }
    }
    console.error(`[IndexerLoader] Synchronized ${count} builtin indexers to ${BUILTIN_INDEXERS_PATH}`);
  } catch (error) {
    console.error(`[IndexerLoader] Failed to synchronize builtin indexers:`, error);
  }
}

/**
 * 利用可能なインデクサーをすべて読み込む
 */
export async function loadAllIndexers(): Promise<IndexerDefinition[]> {
  const indexers: IndexerDefinition[] = [];

  // 1. 同期済みのビルトインインデクサーを読み込み
  if (existsSync(BUILTIN_INDEXERS_PATH)) {
    const builtInIndexers = await loadIndexersFromDirectory(BUILTIN_INDEXERS_PATH);
    indexers.push(...builtInIndexers);
  }

  // 2. ユーザーインデクサーを読み込み
  if (existsSync(USER_INDEXERS_PATH)) {
    const userIndexers = await loadIndexersFromDirectory(USER_INDEXERS_PATH);
    indexers.push(...userIndexers);
  }

  // 3. 環境変数指定のパスから読み込み（テスト用など）
  const extraPath = process.env.CHEMR_EXTRA_INDEXERS_PATH;
  if (extraPath && existsSync(extraPath)) {
    const extraIndexers = await loadIndexersFromDirectory(extraPath);
    indexers.push(...extraIndexers);
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
async function loadIndexerFromFile(filePath: string, forceReload = false): Promise<IndexerDefinition | null> {
  try {
    // dynamic import を使用して ESM をロード
    let fileUrl = pathToFileURL(filePath).href;
    
    // 強制リロードの場合はクエリパラメータを追加してキャッシュを回避
    if (forceReload) {
      fileUrl += `?t=${Date.now()}`;
    }
    
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
export async function getIndexerById(id: string, forceReload = false): Promise<IndexerDefinition | null> {
  // forceReload が true の場合は、個別にファイルを読み直す必要があるため、
  // ディレクトリをスキャンして該当ファイルを探す
  if (forceReload) {
    const paths = [BUILTIN_INDEXERS_PATH, USER_INDEXERS_PATH];
    for (const dirPath of paths) {
      if (!existsSync(dirPath)) continue;
      const files = readdirSync(dirPath);
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        const filePath = join(dirPath, file);
        const indexer = await loadIndexerFromFile(filePath, true);
        if (indexer && indexer.id === id) {
          return indexer;
        }
      }
    }
  }

  const indexers = await loadAllIndexers();
  return indexers.find(indexer => indexer.id === id) || null;
}