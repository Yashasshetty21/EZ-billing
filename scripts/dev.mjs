import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// 1. Run bundle-tesseract-assets.mjs first
const bundleProc = spawn(process.execPath, [join(__dirname, 'bundle-tesseract-assets.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

bundleProc.on('close', (code) => {
  if (code !== 0) {
    console.error(`bundle-tesseract-assets exited with code ${code}`);
    process.exit(code || 1);
  }

  // 2. Start Express backend server
  const serverProc = spawn(process.execPath, [join(root, 'server.js')], {
    cwd: root,
    stdio: 'inherit',
  });

  // 3. Start Vite dev server with hot reload
  const viteProc = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js')], {
    cwd: root,
    stdio: 'inherit',
  });

  const cleanup = () => {
    try { serverProc.kill(); } catch {}
    try { viteProc.kill(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  serverProc.on('exit', (c) => {
    if (c !== null && c !== 0) {
      console.error(`Express server exited with code ${c}`);
    }
  });

  viteProc.on('exit', () => {
    cleanup();
  });
});
