// Wrapper to start chat-widget Vite from the correct working directory
const path = require('path');
const { spawn } = require('child_process');

const widgetDir = path.resolve(__dirname, '..', 'packages', 'chat-widget');
const viteBin = path.resolve(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');

// Forward any CLI args (e.g. --port 3200) to Vite
const args = [viteBin, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  cwd: widgetDir,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code));
