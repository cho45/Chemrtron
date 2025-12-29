import { ElectronAPI } from '@electron-toolkit/preload';
import type { CacheMetadata } from '../shared/types';

interface ChemrtronAPI {
  getIndex: (id: string, reindex?: boolean) => Promise<{ data: string; metadata: CacheMetadata | null }>;
  loadDocument: (url: string) => void;
  onProgress: (callback: (message: string) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ChemrtronAPI;
  }
}
