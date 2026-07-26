#!/usr/bin/env node

/**
 * Build script for Hostinger Static Web Hosting deployment.
 * Guarantees NO 403 FORBIDDEN and full client-side Firebase dynamic features.
 * 
 * Pure static output (no node adapter) → Astro outputs directly to astro-site/dist/
 * No dist/client or dist/server subdirectories.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting Astro Static Build for Hostinger...');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const astroSitePath = path.join(projectRoot, 'astro-site');
const distPath = path.join(projectRoot, 'dist');
const zipPath  = path.join(projectRoot, 'hostinger-deploy.zip');

// 1. Build Astro static site using astro.config.static.mjs (NO node adapter = pure static)
console.log('Running Astro static build...');
execSync('npx astro build --config astro.config.static.mjs', {
  cwd: astroSitePath,
  stdio: 'inherit'
});

// Pure static (no adapter) → outputs directly to astro-site/dist/
// Hybrid (with node adapter) → outputs to astro-site/dist/client/ + astro-site/dist/server/
const astroPureDist  = path.join(astroSitePath, 'dist');
const astroClientDist = path.join(astroPureDist, 'client');
// If client/ subfolder exists it was accidentally built with an adapter — use it; otherwise use flat dist/
const sourceDir = fs.existsSync(astroClientDist) ? astroClientDist : astroPureDist;

// 2. Clear root dist/
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// 3. Copy static build files directly to root dist/
console.log('Copying static build files to dist/...');
fs.cpSync(sourceDir, distPath, { recursive: true });

// 4. Write static .htaccess directly to dist/.htaccess
//
// KEY: LiteSpeed shared hosting often ignores mod_mime AddType for static files.
// We use mod_headers with <FilesMatch> which LiteSpeed ALWAYS respects.
//
// IMPORTANT ordering in RewriteRules:
//   a) Serve existing physical files (CSS/JS/images) WITHOUT rewriting
//   b) Admin SPA → always serve admin.html
//   c) Clean URL: /blog → blog.html
//   d) Pre-rendered slug: /blog/my-post → blog/my-post.html (if file exists)
//   e) Hub fallback: unknown /blog/new-post → blog.html (client-side fetch from Firebase)
//
const htaccessContent = `# Hostinger LiteSpeed Configuration for Astro Static Site
DirectoryIndex index.html

# ─── MIME Types (FilesMatch is respected by LiteSpeed, mod_mime may be ignored) ───
<IfModule mod_headers.c>
  <FilesMatch "\\.js$">
    Header set Content-Type "application/javascript; charset=utf-8"
  </FilesMatch>
  <FilesMatch "\\.mjs$">
    Header set Content-Type "application/javascript; charset=utf-8"
  </FilesMatch>
  <FilesMatch "\\.css$">
    Header set Content-Type "text/css; charset=utf-8"
  </FilesMatch>
  <FilesMatch "\\.json$">
    Header set Content-Type "application/json; charset=utf-8"
  </FilesMatch>
  <FilesMatch "\\.svg$">
    Header set Content-Type "image/svg+xml"
  </FilesMatch>
  <FilesMatch "\\.woff2$">
    Header set Content-Type "font/woff2"
  </FilesMatch>
  <FilesMatch "\\.webp$">
    Header set Content-Type "image/webp"
  </FilesMatch>
  # Allow JS module cross-origin fetch (required for dynamic imports)
  Header set Access-Control-Allow-Origin "*"
  Header set X-Content-Type-Options "nosniff"
</IfModule>

# ─── Fallback with mod_mime (belt-and-suspenders) ───
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
  AddType image/svg+xml .svg
  AddType application/json .json
  AddType image/webp .webp
  AddType font/woff2 .woff2
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Serve existing physical files (JS/CSS/images/fonts/favicon) — no rewrite
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # 2. Serve existing directories (e.g. /assets/)
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 3. Admin SPA — always serve admin.html for any /admin/* route
  RewriteCond %{REQUEST_URI} ^/admin(/|$)
  RewriteRule ^ admin.html [L]

  # 4. Clean URL: /blog → blog.html, /directory → directory.html, etc.
  RewriteCond %{DOCUMENT_ROOT}/%{REQUEST_URI}.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]

  # 5. Pre-rendered slug fallback: /blog/my-post → blog/my-post.html (if pre-built)
  RewriteCond %{DOCUMENT_ROOT}/%{REQUEST_URI}.html -f
  RewriteRule ^(.+)$ $1.html [L]

  # 6. NEW slug fallback: /blog/brand-new-post → blog.html (client fetches from Firebase)
  RewriteRule ^blog/.*$ blog.html [L]
  RewriteRule ^knowledge/.*$ knowledge.html [L]
  RewriteRule ^directory/.*$ directory.html [L]
  RewriteRule ^entrepreneurs/.*$ entrepreneurs.html [L]
  RewriteRule ^author/.*$ author.html [L]
</IfModule>
`;

fs.writeFileSync(path.join(distPath, '.htaccess'), htaccessContent, 'utf8');
console.log('✓ Written dist/.htaccess');

// 5. Create hostinger-deploy.zip
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

console.log('Creating hostinger-deploy.zip...');
execSync(`powershell -Command "Compress-Archive -Path '${distPath}\\*' -DestinationPath '${zipPath}' -Force"`, {
  stdio: 'inherit'
});

const stats = fs.statSync(zipPath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n✅ hostinger-deploy.zip created successfully! (${sizeMb} MB)`);
