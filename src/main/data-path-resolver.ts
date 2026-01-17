import os from 'os';
import path from 'path';
import fs from 'fs';

// キャッシュされたデータディレクトリパス
let cachedDataDir: string | null = null;

/**
 * データディレクトリのベースパスを取得
 *
 * 環境変数 CHEMR_DATA_DIR が設定されていればそれを使用、
 * なければ os.homedir()/.chemr を使用
 *
 * 結果はキャッシュされ、1回だけログを出力する
 *
 * @returns データディレクトリの絶対パス
 */
export function getDataDir(): string {
	// キャッシュがあればそれを返す
	if (cachedDataDir !== null) {
		return cachedDataDir;
	}

	const envDir = process.env.CHEMR_DATA_DIR;

	if (envDir) {
		const normalized = path.resolve(envDir);

		// ディレクトリの存在確認と作成
		if (!fs.existsSync(normalized)) {
			console.error(`[DataPathResolver] CHEMR_DATA_DIR is set but directory does not exist: ${normalized}`);
			console.error(`[DataPathResolver] Attempting to create it...`);
			try {
				fs.mkdirSync(normalized, { recursive: true });
			} catch (error) {
				console.error(`[DataPathResolver] Failed to create directory:`, error);
				throw new Error(`CHEMR_DATA_DIR directory cannot be created: ${normalized}`);
			}
		}

		console.error(`[DataPathResolver] Using CHEMR_DATA_DIR: ${normalized}`);
		cachedDataDir = normalized;
		return normalized;
	}

	// デフォルト
	const defaultDir = path.join(os.homedir(), '.chemr');
	console.error(`[DataPathResolver] Using default data directory: ${defaultDir}`);
	cachedDataDir = defaultDir;
	return defaultDir;
}
