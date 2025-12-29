/// <reference types="vite/client" />

import type { SerializableIndexerMetadata, Settings, CacheMetadata, KeyboardAction } from '../../shared/types';

interface ChemrtronAPI {
  getIndex: (id: string, reindex?: boolean) => Promise<{
    data: string;
    metadata: CacheMetadata | null;
    indexerMetadata: SerializableIndexerMetadata;
  }>;
  getAllIndexers: () => Promise<SerializableIndexerMetadata[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Settings) => Promise<boolean>;
  loadDocument: (url: string) => void;
  onProgress: (callback: (progress: { id: string; state: string; current: number; total: number }) => void) => void;
  onKeyboardAction: (callback: (action: KeyboardAction) => void) => void;
  onUrlChanged: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    api: ChemrtronAPI;
  }
}
