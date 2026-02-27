import { spawn } from 'child_process';
import { exec } from 'child_process';

// Kill processes on ports 3000 and 8080
console.log('[v0] Killing processes on ports 3000 and 8080...');

const killPort = (port) => {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, () => {
      console.log(`[v0] Port ${port} cleared`);
      resolve();
    });
  });
};

async function start() {
  await killPort(3000);
  await killPort(8080);
  
  console.log('[v0] Starting Next.js dev server on port 3000...');
  
  // Start the dev server
  const dev = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  dev.on('error', (err) => {
    console.error('[v0] Failed to start dev server:', err);
    process.exit(1);
  });
}

start().catch(err => {
  console.error('[v0] Error:', err);
  process.exit(1);
});
