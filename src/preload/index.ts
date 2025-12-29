import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { IPC_CHANNELS } from '../shared/types';

// Custom APIs for renderer
const api = {
  // インデックスデータを取得
  getIndex: (id: string, reindex = false) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_INDEX, { id, reindex }),

  // 進捗通知のリスナー登録（将来の実装用）
  onProgress: (callback: (message: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.PROGRESS, (_event, message) => callback(message));
  }
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
