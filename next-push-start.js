// next-push-start.js - Push Prisma schema then start Next.js
const { execSync } = require('child_process');

console.log('Pushing Prisma schema...');
try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (error) {
  console.log('Schema push skipped or failed (may already exist)');
}

console.log('Starting Next.js...');
execSync('npx next start', { stdio: 'inherit' });
