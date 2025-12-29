/**
 * Cache Manager - ~/.chemr/cache/ にインデックスを保存・読み込み
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import type { CacheMetadata } from '../shared/types';

const CACHE_DIR = path.join(app.getPath('home'), '.chemr', 'cache');

/**
 * キャッシュディレクトリを初期化
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * キャッシュファイルのパスを取得
 */
function getCachePath(id: string): string {
  ensureCacheDir();
  return path.join(CACHE_DIR, `${id}.dat`);
}

/**
 * キャッシュが存在するか確認
 */
export function hasCache(id: string): boolean {
  return fs.existsSync(getCachePath(id));
}

/**
 * インデックスデータを保存
 * フォーマット: \x01{metadata}\n{data}
 * @param id インデクサーID
 * @param data タブ区切りデータ (title\turl\n形式)
 * @param metadata メタデータ
 */
export function saveIndex(id: string, data: string, metadata: CacheMetadata): void {
  const cachePath = getCachePath(id);
  const metaString = JSON.stringify(metadata);
  const content = `\x01${metaString}\n${data}`;

  fs.writeFileSync(cachePath, content, 'utf-8');
  console.log(`[CacheManager] Saved index for ${id}: ${data.length} bytes`);
}

/**
 * インデックスデータを読み込み
 * @param id インデクサーID
 * @returns { data: string, metadata: CacheMetadata | null }
 */
export function getIndex(id: string): { data: string; metadata: CacheMetadata | null } {
  const cachePath = getCachePath(id);

  if (!fs.existsSync(cachePath)) {
    throw new Error(`Cache not found for ${id}`);
  }

  const content = fs.readFileSync(cachePath, 'utf-8');

  // メタデータ付きフォーマットの場合
  if (content.charCodeAt(0) === 0x01) {
    const firstLF = content.indexOf('\n');
    const metadata = JSON.parse(content.substring(1, firstLF));
    const data = content.substring(firstLF);
    return { data, metadata };
  } else {
    // レガシーフォーマット（メタデータなし）
    return { data: '\n' + content + '\n', metadata: null };
  }
}

/**
 * キャッシュを削除
 */
export function deleteCache(id: string): void {
  const cachePath = getCachePath(id);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`[CacheManager] Deleted cache for ${id}`);
  }
}
