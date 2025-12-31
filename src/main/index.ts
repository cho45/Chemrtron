import { app, shell, BrowserWindow, WebContentsView, ipcMain, Menu, globalShortcut } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { setupIpcHandlers } from './ipc-handlers';
import { loadSettings } from './settings-manager';
import { syncBuiltinIndexers } from './indexer-loader';
import { exportMcpServer } from './mcp-exporter';
import { IPC_CHANNELS, type KeyboardAction, type FindInPageOptions } from '../shared/types';
import { onIpc } from './ipc-utils';

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
 * グローバルショートカットを登録
 */
function registerGlobalShortcut(): void {
  const settings = loadSettings();
  const shortcut = settings.globalShortcut;

  // 既存のショートカットをすべて解除
  globalShortcut.unregisterAll();

  if (shortcut) {
    try {
      const success = globalShortcut.register(shortcut, () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
          // 検索フィールドにフォーカスを当てる
          sendKeyboardAction('focus-search');
        }
      });

      if (success) {
        console.log(`[Main] Global shortcut registered: ${shortcut}`);
      } else {
        console.warn(`[Main] Failed to register global shortcut: ${shortcut}`);
      }
    } catch (error) {
      console.error(`[Main] Error registering global shortcut: ${error}`);
    }
  }
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
              { 
                label: 'About Chemr',
                click: () => handleKeyboardAction('open-about')
              },
              { type: 'separator' as const },
              {
                label: 'Preferences...',
                accelerator: 'CmdOrCtrl+,',
                click: () => handleKeyboardAction('open-settings')
              },
              {
                label: 'Select Indexer...',
                accelerator: 'CmdOrCtrl+Enter',
                click: () => handleKeyboardAction('open-indexer-search')
              },
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
        },
        ...(!isMac
          ? [
              { type: 'separator' as const },
              {
                label: 'Settings',
                accelerator: 'CmdOrCtrl+,',
                click: () => handleKeyboardAction('open-settings')
              },
              {
                label: 'Select Indexer...',
                accelerator: 'CmdOrCtrl+Enter',
                click: () => handleKeyboardAction('open-indexer-search')
              }
            ]
          : [])
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
        {
          label: 'Find in Page...',
          accelerator: 'CmdOrCtrl+F',
          click: () => handleKeyboardAction('open-find')
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
    },
    // Help メニュー
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'About Chemr',
          click: () => handleKeyboardAction('open-about')
        },
        {
          label: 'Report issue...',
          click: () => {
            shell.openExternal('https://github.com/cho45/Chemrtron/issues');
          }
        }
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

  // コンテキストメニューの実装
  view.webContents.on('context-menu', (_event, params) => {
    const settings = loadSettings();
    const menu = Menu.buildFromTemplate([
      {
        label: 'Back',
        enabled: view.webContents.navigationHistory.canGoBack(),
        click: () => view.webContents.navigationHistory.goBack()
      },
      {
        label: 'Forward',
        enabled: view.webContents.navigationHistory.canGoForward(),
        click: () => view.webContents.navigationHistory.goForward()
      },
      { type: 'separator' },
      { role: 'copy' },
      { type: 'separator' },
      {
        label: 'Open in Browser...',
        click: () => {
          shell.openExternal(params.linkURL || params.pageURL);
        }
      },
      ...(settings.developerMode
        ? [
            { type: 'separator' as const },
            {
              label: 'Inspect Element',
              click: () => {
                view.webContents.inspectElement(params.x, params.y);
              }
            }
          ]
        : [])
    ]);
    menu.popup();
  });

  // ドキュメントロード完了後にフォーカスを mainWindow に戻す
  view.webContents.on('did-finish-load', () => {
    if (mainWindow) {
      mainWindow.webContents.focus();
      mainWindow.webContents.send(IPC_CHANNELS.DOCUMENT_LOADING_STATUS, 'finish');
    }
  });

  view.webContents.on('did-start-loading', () => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.DOCUMENT_LOADING_STATUS, 'start');
    }
  });

  view.webContents.on('did-stop-loading', () => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.DOCUMENT_LOADING_STATUS, 'stop');
    }
  });

  view.webContents.on('did-fail-load', () => {
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.DOCUMENT_LOADING_STATUS, 'error');
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

    // Cmd/Ctrl + F: ページ内検索
    if (cmdOrCtrl && input.key.toLowerCase() === 'f') {
      event.preventDefault();
      handleKeyboardAction('open-find');
      return;
    }
  });

  return view;
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Chemr',
    width: 1440,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
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
  // 環境の初期化
  syncBuiltinIndexers();
  exportMcpServer();

  // Set app user model id for windows
  electronApp.setAppUserModelId('net.lowreal.Chemr');

  // Setup IPC handlers
  setupIpcHandlers();

  // 設定更新の通知を受け取ってショートカットを再登録
  ipcMain.on('settings-updated', () => {
    registerGlobalShortcut();
  });

  // LOAD_DOCUMENT IPCハンドラー
  onIpc(IPC_CHANNELS.LOAD_DOCUMENT, (_event, url: string) => {
    if (documentView) {
      documentView.webContents.loadURL(url);
      // フォーカスは did-finish-load イベントで戻す
    }
  });

  // UPDATE_VIEW_BOUNDS IPCハンドラー
  onIpc(IPC_CHANNELS.UPDATE_VIEW_BOUNDS, (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    if (documentView) {
      documentView.setBounds(bounds);
      // サイズがある場合のみ表示する
      const isVisible = bounds.width > 0 && bounds.height > 0;
      documentView.setVisible(isVisible);
    }
  });

  // FIND_IN_PAGE IPCハンドラー
  onIpc(IPC_CHANNELS.FIND_IN_PAGE, (_event, text: string, options?: FindInPageOptions) => {
    if (documentView) {
      documentView.webContents.findInPage(text, options);
    }
  });

  // STOP_FIND_IN_PAGE IPCハンドラー
  onIpc(IPC_CHANNELS.STOP_FIND_IN_PAGE, (_event, action: 'clearSelection' | 'keepSelection' | 'activateSelection') => {
    if (documentView) {
      documentView.webContents.stopFindInPage(action);
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
  registerGlobalShortcut();

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
