console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);
console.log('Electron version:', process.versions.electron);
console.log('Process type:', process.type);
console.log('');
console.log('Trying to require electron...');
const electron = require('electron');
console.log('typeof electron:', typeof electron);
console.log('');

if (typeof electron === 'object') {
  console.log('SUCCESS: electron is an object!');
  console.log('Available keys:', Object.keys(electron).slice(0, 20).join(', '));
} else {
  console.log('FAIL: electron is', typeof electron);
  console.log('Value:', electron);
}
