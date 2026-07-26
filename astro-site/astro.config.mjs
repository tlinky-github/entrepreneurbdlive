import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://entrepreneurs.bd',
  output: 'server',
  adapter: vercel(),
  image: {
    service: passthroughImageService(),
  },
  compressHTML: true,
  security: {
    checkOrigin: false,
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
      external: ['sharp'],
    },
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
});
