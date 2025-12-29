"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fs = require("fs");
const icon = path.join(__dirname, "../../resources/icon.png");
const IPC_CHANNELS = {
  GET_INDEX: "get-index",
  LOAD_DOCUMENT: "load-document"
};
const CACHE_DIR = path.join(electron.app.getPath("home"), ".chemr", "cache");
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}
function getCachePath(id) {
  ensureCacheDir();
  return path.join(CACHE_DIR, `${id}.dat`);
}
function hasCache(id) {
  return fs.existsSync(getCachePath(id));
}
function getIndex(id) {
  const cachePath = getCachePath(id);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`Cache not found for ${id}`);
  }
  const content = fs.readFileSync(cachePath, "utf-8");
  if (content.charCodeAt(0) === 1) {
    const firstLF = content.indexOf("\n");
    const metadata = JSON.parse(content.substring(1, firstLF));
    const data = content.substring(firstLF);
    return { data, metadata };
  } else {
    return { data: "\n" + content + "\n", metadata: null };
  }
}
function deleteCache(id) {
  const cachePath = getCachePath(id);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
    console.log(`[CacheManager] Deleted cache for ${id}`);
  }
}
function setupIpcHandlers() {
  electron.ipcMain.handle(IPC_CHANNELS.GET_INDEX, async (_event, args) => {
    const { id, reindex } = args;
    try {
      if (reindex) {
        deleteCache(id);
      }
      if (hasCache(id)) {
        const { data, metadata } = getIndex(id);
        console.log(`[IPC] Loaded index for ${id}`, metadata);
        return { data, metadata };
      } else {
        console.log(`[IPC] No cache for ${id}, returning sample data`);
        const sampleData = createSampleData(id);
        return { data: sampleData, metadata: null };
      }
    } catch (error) {
      console.error(`[IPC] Error getting index for ${id}:`, error);
      throw error;
    }
  });
  console.log("[IPC] Handlers registered");
}
function createSampleData(id) {
  if (id === "mdn") {
    return `
Array	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
Array.prototype.map()	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
Array.prototype.filter()	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
Array.prototype.reduce()	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
Promise	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
async function	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
fetch()	https://developer.mozilla.org/en-US/docs/Web/API/fetch
`;
  }
  return "\n";
}
let mainWindow = null;
let documentView = null;
const SIDEBAR_WIDTH = 400;
function createDocumentView() {
  const view = new electron.WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  view.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  return view;
}
function updateDocumentViewBounds() {
  if (!mainWindow || !documentView) return;
  const bounds = mainWindow.getContentBounds();
  documentView.setBounds({
    x: SIDEBAR_WIDTH,
    y: 0,
    width: bounds.width - SIDEBAR_WIDTH,
    height: bounds.height
  });
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  mainWindow.on("resize", () => {
    updateDocumentViewBounds();
  });
  documentView = createDocumentView();
  mainWindow.contentView.addChildView(documentView);
  updateDocumentViewBounds();
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  setupIpcHandlers();
  electron.ipcMain.on(IPC_CHANNELS.LOAD_DOCUMENT, (_event, url) => {
    if (documentView) {
      documentView.webContents.loadURL(url);
    }
  });
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
