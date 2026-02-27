const { execSync } = require('child_process');

try {
  console.log('[v0] Killing all Node.js processes...');
  execSync('pkill -f node || true', { stdio: 'inherit' });
  console.log('[v0] All Node.js processes killed');
} catch (err) {
  console.log('[v0] Error killing processes:', err.message);
}

setTimeout(() => {
  console.log('[v0] Done');
  process.exit(0);
}, 1000);
