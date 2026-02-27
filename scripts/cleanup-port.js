import { exec } from 'child_process';

// Kill process on port 8080
exec('lsof -i :8080 | grep LISTEN | awk "{print $2}" | xargs kill -9 2>/dev/null || true', (error) => {
  if (!error) {
    console.log('Port 8080 cleaned up');
  }
});

// Kill process on port 3000
exec('lsof -i :3000 | grep LISTEN | awk "{print $2}" | xargs kill -9 2>/dev/null || true', (error) => {
  if (!error) {
    console.log('Port 3000 cleaned up');
  }
});
