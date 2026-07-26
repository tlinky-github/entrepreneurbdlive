import { defineConfig, passthroughImageService } from 'astro/config';
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
  // Use passthrough image service — no sharp needed at runtime.
  // Images are served as-is; Astro already optimises them at build time.
  image: {
    service: passthroughImageService(),
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  server: {
    host: true,
    port: 4323,
  },
  build: {
    inlineStylesheets: 'never',
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
      // Force-bundle these packages into the server output so no node_modules
      // are needed at runtime on Hostinger.
      noExternal: [
        'lucide-react',
        'react-router-dom',
        'react-router',
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/auth',
        'firebase-admin/firestore',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
        '@aws-sdk/lib-storage',
      ],
      // sharp is no longer used (passthroughImageService handles images)
      external: ['sharp'],
    },
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
});
