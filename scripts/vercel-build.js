const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- Starting Vercel Build for Astro ---');

const rootDir = path.resolve(__dirname, '..');
const astroSiteDir = path.join(rootDir, 'astro-site');
const astroVercelOutput = path.join(astroSiteDir, '.vercel');
const rootVercelOutput = path.join(rootDir, '.vercel');

// 1. Install astro-site dependencies if needed
console.log('Building astro-site...');
execSync('npm run build', {
  cwd: astroSiteDir,
  stdio: 'inherit'
});

// 2. Copy .vercel output to workspace root if Vercel is building from root
if (fs.existsSync(astroVercelOutput)) {
  console.log('Copying .vercel output to root workspace...');
  if (fs.existsSync(rootVercelOutput)) {
    fs.rmSync(rootVercelOutput, { recursive: true, force: true });
  }
  fs.cpSync(astroVercelOutput, rootVercelOutput, { recursive: true });
  console.log('✓ Moved .vercel output to root successfully!');
}

console.log('--- Vercel Build Complete ---');
