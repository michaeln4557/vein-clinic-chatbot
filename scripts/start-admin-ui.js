// Wrapper to start admin-ui Vite from the correct working directory
// so PostCSS/Tailwind finds its config files.
const path = require('path');
const { spawn } = require('child_process');

const adminDir = path.resolve(__dirname, '..', 'packages', 'admin-ui');
const viteBin = path.resolve(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');

// Forward any CLI args (e.g. --port 3100) to Vite
const args = [viteBin, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  cwd: adminDir,
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code));
