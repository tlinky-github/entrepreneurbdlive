// Hostinger Node.js Application Entry Point
process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.PORT = process.env.PORT || process.env.APP_PORT || 3000;

import('./dist/server/entry.mjs').catch((err) => {
  console.error('Failed to start Astro server:', err);
});
