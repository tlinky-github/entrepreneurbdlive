import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://entrepreneurs.bd',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  compressHTML: true,
  server: {
    host: true,
    port: 4323,
  },
  build: {
    inlineStylesheets: 'never'
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
    ssr: {
      noExternal: ['lucide-react', 'react-router-dom', 'react-router'],
      external: ['sharp', 'firebase-admin', '@aws-sdk/client-s3'],
    },
    optimizeDeps: {
      exclude: ['sharp', 'firebase-admin', '@aws-sdk/client-s3'],
    },
  },
});
