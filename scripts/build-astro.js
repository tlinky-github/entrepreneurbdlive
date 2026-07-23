#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Starting Astro build process...');

// Ensure we're in the correct directory
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log(`Working directory: ${process.cwd()}`);

// Verify package.json exists
const packageJsonPath = path.join(projectRoot, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(`ERROR: package.json file not found at ${packageJsonPath}`);
  process.exit(1);
}

// Verify astro-site exists
const astroSitePath = path.join(projectRoot, 'astro-site');
if (!fs.existsSync(astroSitePath)) {
  console.error(`ERROR: astro-site directory not found at ${astroSitePath}`);
  process.exit(1);
}

const outputDirs = ['dist', 'build'];
const sourceDir = path.join(astroSitePath, 'dist');

if (!fs.existsSync(sourceDir)) {
  console.error(`ERROR: astro-site/dist not created. Build may have failed.`);
  process.exit(1);
}

console.log(`✓ Found astro-site/dist source directory`);

// Remove existing output directories
outputDirs.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing existing ${dir} directory...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
  fs.mkdirSync(fullPath, { recursive: true });
});

// Copy files into dist and build
outputDirs.forEach(dir => {
  const targetPath = path.join(projectRoot, dir);
  console.log(`Structuring ${dir} directory for Hostinger deployment...`);

  // Copy everything in sourceDir
  fs.cpSync(sourceDir, targetPath, { recursive: true });

  // If sourceDir has client/, copy client contents directly to target root
  const clientDir = path.join(sourceDir, 'client');
  if (fs.existsSync(clientDir)) {
    fs.cpSync(clientDir, targetPath, { recursive: true });
  }

  // Ensure root .htaccess exists in target dir for Hostinger Node SSR deployment
  const htaccessPath = path.join(targetPath, '.htaccess');
  const htaccessContent = `# Hostinger Apache / LiteSpeed Web Server Configuration for Astro Node SSR
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Serve existing static assets directly (_astro, images, css, js)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 2. Proxy dynamic requests to local Node server process
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>

# Passenger / LiteSpeed Node.js Application Startup Configuration
PassengerEnabled on
PassengerAppType node
PassengerStartupFile server.js

Options -Indexes
`;
  fs.writeFileSync(htaccessPath, htaccessContent);
  console.log(`✓ Successfully configured ${dir}`);
});

console.log('✓ Build process completed successfully!');

