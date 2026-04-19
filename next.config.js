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
  // Mapping the existing environment variables
  env: {
    REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
    REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
    REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    REACT_APP_ADMIN_EMAIL: process.env.REACT_APP_ADMIN_EMAIL,
    REACT_APP_TURNSTILE_SITE_KEY: process.env.REACT_APP_TURNSTILE_SITE_KEY,
  },
  // Ensure we don't break existing TUI components that might need transpile
  transpilePackages: ['tui-image-editor'],
};

module.exports = nextConfig;
