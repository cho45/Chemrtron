/**
 * Settings Manager - 設定ファイルの読み書き
 */

import { app } from 'electron';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Settings } from '../shared/types';

const SETTINGS_DIR = join(app.getPath('home'), '.chemr');
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  enabled: ['sample', 'mdn'],
  developerMode: false,
  globalShortcut: 'Alt+Space'
};

/**
 * 設定ディレクトリを確保
 */
function ensureSettingsDir(): void {
  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true });
  }
}

/**
 * 設定を読み込み
 */
export function loadSettings(): Settings {
  ensureSettingsDir();

  console.log('[SettingsManager] loadSettings file path:', SETTINGS_FILE);
  if (!existsSync(SETTINGS_FILE)) {
    // 設定ファイルがない場合はデフォルトを返す
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const data = readFileSync(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    // デフォルト値とマージ
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('[SettingsManager] Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 設定を保存
 */
export function saveSettings(settings: Settings): void {
  ensureSettingsDir();

  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    console.log('[SettingsManager] Settings saved:', SETTINGS_FILE);
  } catch (error) {
    console.error('[SettingsManager] Failed to save settings:', error);
    throw error;
  }
}
