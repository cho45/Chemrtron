console.log('Testing electron module...');
const electron = require('electron');
console.log('electron:', typeof electron);
console.log('electron.app:', typeof electron.app);
console.log('electron keys:', Object.keys(electron).slice(0, 10));

if (electron.app) {
  console.log('SUCCESS: electron.app is available');
  electron.app.on('ready', () => {
    console.log('Electron app ready!');
    electron.app.quit();
  });
} else {
  console.error('FAIL: electron.app is undefined');
  process.exit(1);
}
