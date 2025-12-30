import { ElectronAPI } from '@electron-toolkit/preload';
import type { CacheMetadata, KeyboardAction } from '../shared/types';

interface ChemrtronAPI {
  getIndex: (id: string, reindex?: boolean) => Promise<{ 
    data: string; 
    metadata: CacheMetadata | null; 
    indexerMetadata: SerializableIndexerMetadata;
  }>;
  getAllIndexers: () => Promise<SerializableIndexerMetadata[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Settings) => Promise<boolean>;
  getAboutInfo: () => Promise<{ 
    version: string; 
    contributors: string; 
    credits: string; 
    indexerCopyrights: Array<{ id: string; name: string; copyright: string }>;
  }>;
  loadDocument: (url: string) => void;
  onProgress: (callback: (progress: { id: string; state: string; current: number; total: number }) => void) => void;
  onKeyboardAction: (callback: (action: KeyboardAction) => void) => void;
  onUrlChanged: (callback: (url: string) => void) => void;
  updateViewBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  findInPage: (text: string, options?: any) => void;
  stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ChemrtronAPI;
  }
}
