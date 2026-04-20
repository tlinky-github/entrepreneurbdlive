/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    // Vercel Free Tier Optimization: Keep processed images count low
    minimumCacheTTL: 60,
  },
  // Next.js natively loads .env files. No need for manual mapping unless exposing to client (use NEXT_PUBLIC_ instead).
  // Ensure we don't break existing TUI components that might need transpile
  transpilePackages: ['tui-image-editor'],
};

module.exports = nextConfig;
