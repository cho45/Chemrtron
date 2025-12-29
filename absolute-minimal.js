const { app, BrowserWindow } = require('electron');

console.log('=== Minimal Electron App ===');
console.log('typeof require("electron"):', typeof require('electron'));
console.log('app exists:', !!app);
console.log('BrowserWindow exists:', !!BrowserWindow);

app.whenReady().then(() => {
  console.log('App ready! Creating window...');
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('data:text/html,<h1>Success!</h1>');

  setTimeout(() => {
    console.log('Quitting...');
    app.quit();
  }, 2000);
});
