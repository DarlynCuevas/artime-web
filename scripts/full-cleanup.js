const { execSync } = require('child_process');

console.log('[v0] Performing full environment cleanup...');

// Kill all node processes that might be using ports
try {
  execSync('pkill -9 node 2>/dev/null || true');
  console.log('[v0] Killed all Node.js processes');
} catch (e) {
  console.log('[v0] No Node.js processes to kill');
}

// Kill processes on specific ports as backup
try {
  execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');
  execSync('lsof -ti:8080 | xargs kill -9 2>/dev/null || true');
  execSync('lsof -ti:5000 | xargs kill -9 2>/dev/null || true');
  console.log('[v0] Cleared ports 3000, 8080, 5000');
} catch (e) {
  console.log('[v0] Port clearing completed');
}

console.log('[v0] Cleanup complete. You can now start the dev server.');
