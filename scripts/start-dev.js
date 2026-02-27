const { exec } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[v0] Killing processes on ports 3000 and 8080...');

// Kill processes on ports
exec('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', (err) => {
  if (!err) console.log('[v0] Port 3000 cleared');
});

exec('lsof -ti:8080 | xargs kill -9 2>/dev/null || true', (err) => {
  if (!err) console.log('[v0] Port 8080 cleared');
  
  // Wait a bit and then start the dev server
  setTimeout(() => {
    console.log('[v0] Starting Next.js dev server on port 3000...');
    
    const nextPath = path.join(process.cwd(), 'node_modules/.bin/next');
    
    // Check if next binary exists
    if (fs.existsSync(nextPath)) {
      const child = spawn(nextPath, ['dev'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (err) => {
        console.error('[v0] Failed to start dev server:', err);
        process.exit(1);
      });
    } else {
      console.log('[v0] Next binary not found, trying with npx...');
      const child = spawn('npx', ['next', 'dev'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (err) => {
        console.error('[v0] Failed to start dev server:', err);
        process.exit(1);
      });
    }
  }, 1000);
});
