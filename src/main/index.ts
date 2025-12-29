import { app, shell, BrowserWindow, WebContentsView, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { setupIpcHandlers } from './ipc-handlers';
import { IPC_CHANNELS } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let documentView: WebContentsView | null = null;

const SIDEBAR_WIDTH = 400; // 左側の検索結果リストの幅

function createDocumentView(): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  view.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  return view;
}

function updateDocumentViewBounds(): void {
  if (!mainWindow || !documentView) return;

  const bounds = mainWindow.getContentBounds();
  documentView.setBounds({
    x: SIDEBAR_WIDTH,
    y: 0,
    width: bounds.width - SIDEBAR_WIDTH,
    height: bounds.height
  });
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // ウィンドウのリサイズ時にWebContentsViewのサイズを調整
  mainWindow.on('resize', () => {
    updateDocumentViewBounds();
  });

  // WebContentsViewを作成して追加
  documentView = createDocumentView();
  mainWindow.contentView.addChildView(documentView);
  updateDocumentViewBounds();

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Setup IPC handlers
  setupIpcHandlers();

  // LOAD_DOCUMENT IPCハンドラー
  ipcMain.on(IPC_CHANNELS.LOAD_DOCUMENT, (_event, url: string) => {
    if (documentView) {
      documentView.webContents.loadURL(url);
    }
  });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
