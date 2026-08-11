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
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
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
      noExternal: ['lucide-react', 'react-router-dom', 'react-router', 'sonner'],
      external: ['sharp', 'firebase-admin', 'firebase-admin/firestore', 'firebase-admin/auth', '@aws-sdk/client-s3'],
    },
    optimizeDeps: {
      include: ['sonner'],
      exclude: ['sharp', 'firebase-admin', 'firebase-admin/firestore', 'firebase-admin/auth', '@aws-sdk/client-s3'],
    },
  },
});
