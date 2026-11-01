/* Launch the static server as a detached process so it outlives this shell. */
const { spawn } = require('node:child_process');
const path = require('node:path');

const server = path.join(__dirname, 'serve.cjs');
const child = spawn(process.execPath, [server], {
  cwd: path.resolve(__dirname, '..'),
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
});
child.unref();
console.log(JSON.stringify({ pid: child.pid, url: 'http://127.0.0.1:8798/index.html' }));
