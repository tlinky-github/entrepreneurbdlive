import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lawngreen-hippopotamus-233067.hostingersite.com',
  output: 'static',
  // No adapter needed for pure static hosting (Hostinger serves flat files from public_html)
  image: {
    service: passthroughImageService(),
  },
  compressHTML: true,
  build: {
    format: 'file',
    assets: 'assets',
    inlineStylesheets: 'always'
  },
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    envPrefix: ['PUBLIC_', 'REACT_APP_'],
  },
});
