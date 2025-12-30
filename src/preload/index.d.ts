import { ElectronAPI } from '@electron-toolkit/preload';
import type { CacheMetadata, KeyboardAction, Settings, SerializableIndexerMetadata, ProgressInfo, FindInPageOptions, AboutInfo } from '../shared/types';

interface ChemrtronAPI {
  getIndex: (id: string, reindex?: boolean) => Promise<{ 
    data: string; 
    metadata: CacheMetadata | null; 
    indexerMetadata: SerializableIndexerMetadata;
  }>;
  getAllIndexers: () => Promise<SerializableIndexerMetadata[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Settings) => Promise<boolean>;
  getAboutInfo: () => Promise<AboutInfo>;
  loadDocument: (url: string) => void;
  onProgress: (callback: (progress: ProgressInfo) => void) => void;
  onKeyboardAction: (callback: (action: KeyboardAction) => void) => void;
  onUrlChanged: (callback: (url: string) => void) => void;
  updateViewBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  findInPage: (text: string, options?: FindInPageOptions) => void;
  stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: ChemrtronAPI;
  }
}
