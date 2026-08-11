import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const pathname = context.url.pathname;

  // Never cache dynamic authenticated, admin, submission, or API routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/submit') ||
    pathname.startsWith('/visual-editor')
  ) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    return response;
  }

  // Skip static assets as Vercel and Cloudflare handle asset caching automatically via vercel.json
  if (
    pathname.startsWith('/_astro/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff')
  ) {
    return response;
  }

  // Inject Stale-While-Revalidate Edge Caching for all public content pages:
  // - s-maxage=60: Cloudflare and Vercel Edge CDN cache HTML for 60s (<30ms TTFB)
  // - stale-while-revalidate=600: Background revalidation updates Edge cache when Firebase content updates
  response.headers.set(
    'Cache-Control',
    'public, max-age=0, s-maxage=60, stale-while-revalidate=600'
  );

  return response;
});
