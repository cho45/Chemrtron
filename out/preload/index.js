"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const IPC_CHANNELS = {
  GET_INDEX: "get-index",
  PROGRESS: "progress"
};
const api = {
  // インデックスデータを取得
  getIndex: (id, reindex = false) => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_INDEX, { id, reindex }),
  // 進捗通知のリスナー登録（将来の実装用）
  onProgress: (callback) => {
    electron.ipcRenderer.on(IPC_CHANNELS.PROGRESS, (_event, message) => callback(message));
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
