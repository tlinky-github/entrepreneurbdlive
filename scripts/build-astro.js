#!/usr/bin/env node

/**
 * Build script for Hostinger Node.js SSR deployment.
 *
 * What it does:
 *  1. Verifies astro-site/dist exists (from `astro build`)
 *  2. Clears and rebuilds the root `dist/` and `build/` directories
 *  3. Copies client static files to the root of dist/ (Apache serves these directly)
 *  4. Copies the server bundle into dist/server/
 *  5. PATCHES dist/server/entry.mjs to replace hardcoded absolute Windows paths
 *     with relative import.meta.url-based paths (critical for Linux deployment)
 *  6. PATCHES dist/server/entry.mjs port to use process.env.PORT (critical for Hostinger)
 *  7. Writes a dist/server.js entry point that Passenger/Node starts
 *  8. Writes a production package.json to dist/ (for npm install on server)
 *  9. Writes a correct .htaccess for Hostinger Apache/LiteSpeed
 *
 * On Hostinger hPanel, set:
 *   App Root     = <your_project>/dist/
 *   Startup File = server.js
 *   Node version = 18.x or 20.x
 *   Then run: npm install --production
 */

const fs   = require('fs');
const path = require('path');

console.log('Starting Astro build process...');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);
console.log(`Working directory: ${process.cwd()}`);

// ── Verify prerequisites ──────────────────────────────────────────────────────

const packageJsonPath = path.join(projectRoot, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(`ERROR: package.json not found at ${packageJsonPath}`);
  process.exit(1);
}

const astroSitePath = path.join(projectRoot, 'astro-site');
if (!fs.existsSync(astroSitePath)) {
  console.error(`ERROR: astro-site directory not found`);
  process.exit(1);
}

const sourceDir = path.join(astroSitePath, 'dist');
if (!fs.existsSync(sourceDir)) {
  console.error(`ERROR: astro-site/dist not found — did astro build succeed?`);
  process.exit(1);
}

const sourceClientDir = path.join(sourceDir, 'client');
const sourceServerDir = path.join(sourceDir, 'server');

if (!fs.existsSync(sourceClientDir)) {
  console.error(`ERROR: astro-site/dist/client not found`);
  process.exit(1);
}
if (!fs.existsSync(sourceServerDir)) {
  console.error(`ERROR: astro-site/dist/server not found`);
  process.exit(1);
}

console.log('✓ Found astro-site/dist/client and dist/server');

// ── Build into both dist/ and build/ ─────────────────────────────────────────

const outputDirs = ['dist', 'build'];

outputDirs.forEach(dir => {
  const targetPath = path.join(projectRoot, dir);

  // Wipe and recreate
  if (fs.existsSync(targetPath)) {
    console.log(`Removing existing ${dir}/ ...`);
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  fs.mkdirSync(targetPath, { recursive: true });

  // 1. Copy ALL client static files to the root of the target dir
  //    Apache/LiteSpeed will serve these directly (CSS, JS, images, etc.)
  console.log(`Copying client static files → ${dir}/`);
  fs.cpSync(sourceClientDir, targetPath, { recursive: true });

  // 2. Copy server bundle into target/server/
  //    This keeps it out of the web-accessible root path
  const targetServerDir = path.join(targetPath, 'server');
  console.log(`Copying server bundle → ${dir}/server/`);
  fs.cpSync(sourceServerDir, targetServerDir, { recursive: true });

  // 3. PATCH entry.mjs — fix two critical issues for Hostinger deployment:
  //    a) Replace hardcoded absolute Windows paths with relative import.meta.url paths
  //    b) Replace hardcoded port with process.env.PORT so Hostinger controls the port
  const entryMjsPath = path.join(targetServerDir, 'entry.mjs');
  if (fs.existsSync(entryMjsPath)) {
    let content = fs.readFileSync(entryMjsPath, 'utf8');

    // Fix (a): Replace "client": "file:///absolute/Windows/path/to/dist/client/"
    content = content.replace(
      /"client"\s*:\s*"file:\/\/[^"]*"/,
      '"client": new URL(\'../\', import.meta.url).href'
    );

    // Fix (a): Replace "server": "file:///absolute/Windows/path/to/dist/server/"
    content = content.replace(
      /"server"\s*:\s*"file:\/\/[^"]*"/,
      '"server": new URL(\'./\', import.meta.url).href'
    );

    // Fix (b): Replace hardcoded port (e.g. 4323) with process.env.PORT fallback
    //          The Astro node adapter checks process.env.PORT before _args.port,
    //          but patching it here guarantees port 3000 is the baseline.
    content = content.replace(
      /"port"\s*:\s*\d+/,
      '"port": parseInt(process.env.PORT || process.env.APP_PORT || \'3000\', 10)'
    );

    fs.writeFileSync(entryMjsPath, content, 'utf8');
    console.log(`✓ Patched ${dir}/server/entry.mjs (paths + port)`);
  } else {
    console.warn(`WARN: ${dir}/server/entry.mjs not found — skipping patch`);
  }

  // 4. Write dist/server.js — Passenger starts this file
  //    Uses __dirname so the path is always correct regardless of CWD.
  //    Sets PORT before loading entry.mjs so the Astro server binds correctly.
  const serverJsContent = `// Hostinger Node.js Application Entry Point
// Auto-generated by scripts/build-astro.js — do not edit manually.
'use strict';

const path = require('path');
const { pathToFileURL } = require('url');

// Port: Hostinger sets APP_PORT; fall back to 3000
process.env.PORT = process.env.PORT || process.env.APP_PORT || '3000';
process.env.HOST = process.env.HOST || '0.0.0.0';

const entryFile = path.join(__dirname, 'server', 'entry.mjs');
const entryUrl  = pathToFileURL(entryFile).href;

console.log('[server.js] Starting Astro SSR server on port ' + process.env.PORT);

import(entryUrl).catch((err) => {
  console.error('[server.js] Failed to start Astro server:', err);
  process.exit(1);
});
`;
  fs.writeFileSync(path.join(targetPath, 'server.js'), serverJsContent, 'utf8');
  console.log(`✓ Written ${dir}/server.js`);

  // 5. Write a minimal production package.json
  //    All runtime deps (firebase-admin, @aws-sdk, etc.) are now bundled into
  //    the server chunks by Vite, so no npm install is needed on the server.
  const prodPackageJson = {
    name: 'entrepreneurs-bd-server',
    version: '1.0.0',
    private: true,
    description: 'Entrepreneurs BD — Astro SSR production server (fully self-contained)',
    scripts: {
      start: 'node server.js'
    },
    dependencies: {},
    engines: {
      node: '>=18.0.0'
    }
  };
  fs.writeFileSync(
    path.join(targetPath, 'package.json'),
    JSON.stringify(prodPackageJson, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${dir}/package.json (production deps only)`);

  // 6. Write .htaccess for Hostinger Apache / LiteSpeed
  //    - PassengerEnabled launches server.js as the Node.js process
  //    - Static files in the root are served directly by Apache (fast)
  //    - /server/ sub-path is blocked from direct web access (security)
  //    - Port 3000 matches what server.js and entry.mjs use
  const htaccessContent = `# Hostinger Apache / LiteSpeed — Astro Node.js SSR
# Auto-generated by scripts/build-astro.js

# ── Passenger / LiteSpeed Node.js App ────────────────────────────────────────
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js

# ── Rewrite rules ─────────────────────────────────────────────────────────────
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Block direct web access to the server-side bundle (security)
  RewriteRule ^server(/|$) - [F,L]

  # Serve existing static files and directories directly (CSS, JS, images, etc.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Proxy all other requests to the Astro Node.js server (port 3000)
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>

# ── Security ──────────────────────────────────────────────────────────────────
Options -Indexes

# Block hidden dot-files (e.g. .env, .git)
<FilesMatch "^\\.">
  Order allow,deny
  Deny from all
</FilesMatch>
`;
  fs.writeFileSync(path.join(targetPath, '.htaccess'), htaccessContent, 'utf8');
  console.log(`✓ Written ${dir}/.htaccess`);

  console.log(`✓ ${dir}/ is ready for Hostinger deployment`);
  console.log('');
});

console.log('✅ Build complete!');
console.log('');
console.log('Next steps on Hostinger:');
console.log('  1. Upload dist/ contents to your Node.js app root');
console.log('  2. SSH in and run: npm install --production');
console.log('  3. In hPanel → Node.js App → Startup file: server.js');
console.log('  4. Restart the Node.js app');
