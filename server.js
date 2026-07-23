// Local development entry point — mirrors what dist/server.js does at runtime.
// For Hostinger production, the dist/ folder has its own server.js written by build-astro.js.
'use strict';

const path = require('path');
const { pathToFileURL } = require('url');

process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.PORT = process.env.PORT || process.env.APP_PORT || '3000';

const entryFile = path.join(__dirname, 'dist', 'server', 'entry.mjs');
const entryUrl  = pathToFileURL(entryFile).href;

import(entryUrl).catch((err) => {
  console.error('[server.js] Failed to start Astro server:', err);
  process.exit(1);
});
