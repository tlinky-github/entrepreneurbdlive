import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://entrepreneurs.bd',
  output: 'server',
  adapter: vercel(),
  compressHTML: true,
  security: {
    checkOrigin: false,
  },
  server: {
    host: true,
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
