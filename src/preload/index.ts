import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { IPC_CHANNELS, type KeyboardAction } from '../shared/types';

// Custom APIs for renderer
const api = {
  // インデックスデータを取得
  getIndex: (id: string, reindex = false) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_INDEX, { id, reindex }),

  // ドキュメントをロード
  loadDocument: (url: string) => {
    ipcRenderer.send(IPC_CHANNELS.LOAD_DOCUMENT, url);
  },

  // 進捗通知のリスナー登録（将来の実装用）
  onProgress: (callback: (message: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.PROGRESS, (_event, message) => callback(message));
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
