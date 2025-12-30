import { app, shell, BrowserWindow, WebContentsView, ipcMain, Menu } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { setupIpcHandlers } from './ipc-handlers';
import { IPC_CHANNELS, type KeyboardAction } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let documentView: WebContentsView | null = null;

/**
 * キーボードアクションをレンダラープロセスに送信
 */
function sendKeyboardAction(action: KeyboardAction): void {
  if (!mainWindow) return;
  mainWindow.webContents.send(IPC_CHANNELS.KEYBOARD_ACTION, action);
}

/**
 * キーボードアクションを処理
 */
function handleKeyboardAction(action: KeyboardAction): void {
  // WebContentsView に対する操作は main process で処理
  if (action === 'go-back' && documentView) {
    const nav = documentView.webContents.navigationHistory;
    if (nav.canGoBack()) {
      nav.goBack();
    }
    return;
  }

  if (action === 'go-forward' && documentView) {
    const nav = documentView.webContents.navigationHistory;
    if (nav.canGoForward()) {
      nav.goForward();
    }
    return;
  }

  // focus-search の場合は mainWindow にフォーカスを戻す
  if (action === 'focus-search' && mainWindow) {
    mainWindow.webContents.focus();
  }

  // それ以外のアクションは renderer に転送
  sendKeyboardAction(action);
}

/**
 * アプリケーションメニューを作成
 */
function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS のアプリメニュー
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // Edit メニュー
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
        { type: 'separator' as const },
        {
          label: 'Focus Search',
          accelerator: 'CmdOrCtrl+L',
          click: () => handleKeyboardAction('focus-search')
        }
      ]
    },

    // View メニュー
    {
      label: 'View',
      submenu: [
        {
          label: 'Back',
          accelerator: isMac ? 'Cmd+[' : 'Ctrl+[',
          click: () => handleKeyboardAction('go-back')
        },
        {
          label: 'Forward',
          accelerator: isMac ? 'Cmd+]' : 'Ctrl+]',
          click: () => handleKeyboardAction('go-forward')
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const }
      ]
    },

    // Window メニュー
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'close' as const },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

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

  // ドキュメントロード完了後にフォーカスを mainWindow に戻す
  view.webContents.on('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.focus();
    }
  });

  // URL変更時にRendererに通知
  view.webContents.on('did-navigate', (_event, url) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.URL_CHANGED, url);
    }
  });

  view.webContents.on('did-navigate-in-page', (_event, url) => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.URL_CHANGED, url);
    }
  });

  // WebContentsView でのキーボードショートカットをインターセプト
  view.webContents.on('before-input-event', (event, input) => {
    const isMac = process.platform === 'darwin';
    const cmdOrCtrl = isMac ? input.meta : input.control;

    // Cmd/Ctrl + L: 検索フィールドにフォーカス
    if (cmdOrCtrl && input.key.toLowerCase() === 'l') {
      event.preventDefault();
      handleKeyboardAction('focus-search');
      return;
    }

    // Cmd/Ctrl + [: 戻る
    if (cmdOrCtrl && input.key === '[') {
      event.preventDefault();
      handleKeyboardAction('go-back');
      return;
    }

    // Cmd/Ctrl + ]: 進む
    if (cmdOrCtrl && input.key === ']') {
      event.preventDefault();
      handleKeyboardAction('go-forward');
      return;
    }
  });

  return view;
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

  // WebContentsViewを作成して追加
  documentView = createDocumentView();
  mainWindow.contentView.addChildView(documentView);

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
      // フォーカスは did-finish-load イベントで戻す
    }
  });

  // UPDATE_VIEW_BOUNDS IPCハンドラー
  ipcMain.on(IPC_CHANNELS.UPDATE_VIEW_BOUNDS, (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    if (documentView) {
      documentView.setBounds(bounds);
    }
  });

  // アプリケーションメニューを作成
  createApplicationMenu();

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
