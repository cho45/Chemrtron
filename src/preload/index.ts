import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { IPC_CHANNELS, type KeyboardAction } from '../shared/types';

// Custom APIs for renderer
const api = {
  // インデックスデータを取得
  getIndex: (id: string, reindex = false) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_INDEX, { id, reindex }),

  // 全インデクサーリストを取得
  getAllIndexers: () =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_ALL_INDEXERS),

  // 設定を取得
  getSettings: () =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),

  // 設定を更新
  updateSettings: (settings: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, settings),

  // ドキュメントをロード
  loadDocument: (url: string) => {
    ipcRenderer.send(IPC_CHANNELS.LOAD_DOCUMENT, url);
  },

  // 進捗通知のリスナー登録
  onProgress: (callback: (progress: { id: string; state: string; current: number; total: number }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.PROGRESS, (_event, progress) => callback(progress));
  },

  // キーボードアクションのリスナー登録
  onKeyboardAction: (callback: (action: KeyboardAction) => void) => {
    ipcRenderer.on(IPC_CHANNELS.KEYBOARD_ACTION, (_event, action) => callback(action));
  },

  // URL変更のリスナー登録
  onUrlChanged: (callback: (url: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.URL_CHANGED, (_event, url) => callback(url));
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
