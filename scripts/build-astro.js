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

console.log(`✓ Found package.json at ${packageJsonPath}`);

// Verify astro-site exists
const astroSitePath = path.join(projectRoot, 'astro-site');
if (!fs.existsSync(astroSitePath)) {
  console.error(`ERROR: astro-site directory not found at ${astroSitePath}`);
  process.exit(1);
}

console.log(`✓ Found astro-site at ${astroSitePath}`);

// Define directories to clean/create
const outputDirs = ['dist', 'build'];
const sourceDir = path.join(astroSitePath, 'dist');

// Check if source directory exists after build
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
});

// Copy astro-site/dist to both dist and build
outputDirs.forEach(dir => {
  const targetPath = path.join(projectRoot, dir);
  console.log(`Copying astro-site/dist to ${dir}...`);
  fs.cpSync(sourceDir, targetPath, { recursive: true });
  console.log(`✓ Successfully copied to ${dir}`);
});

console.log('✓ Build process completed successfully!');
