import { ElectronAPI } from '@electron-toolkit/preload';
import type { CacheMetadata } from '../shared/types';

interface ChemrtronAPI {
  getIndex: (id: string, reindex?: boolean) => Promise<{ data: string; metadata: CacheMetadata | null }>;
  onProgress: (callback: (message: string) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ChemrtronAPI;
  }
}
