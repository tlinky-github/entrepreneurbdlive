#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://entrepreneurs.bd';
const PUBLIC_DIR = path.join(__dirname, '../public');

// Define all static routes
const staticRoutes = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/blog', changefreq: 'daily', priority: 0.9 },
  { url: '/entrepreneurs', changefreq: 'daily', priority: 0.9 },
  { url: '/directory', changefreq: 'daily', priority: 0.9 },
  { url: '/resources', changefreq: 'weekly', priority: 0.8 },
  { url: '/knowledge', changefreq: 'weekly', priority: 0.8 },
  { url: '/resources/guides', changefreq: 'weekly', priority: 0.7 },
  { url: '/resources/faqs', changefreq: 'weekly', priority: 0.7 },
  { url: '/resources/glossary', changefreq: 'weekly', priority: 0.7 },
  { url: '/editorial', changefreq: 'monthly', priority: 0.6 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.5 },
  { url: '/disclaimer', changefreq: 'yearly', priority: 0.5 },
  { url: '/terms', changefreq: 'yearly', priority: 0.5 },
];

/**
 * Generates XML entry for a URL
 */
function createUrlEntry(baseUrl, changefreq, priority) {
  const lastmod = new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Generates the complete sitemap XML
 */
function generateSitemap(routes) {
  const urlEntries = routes.map(route => 
    createUrlEntry(
      `${SITE_URL}${route.url}`,
      route.changefreq,
      route.priority
    )
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Main function to generate and write sitemap
 */
function main() {
  try {
    // Create sitemap content
    const sitemapContent = generateSitemap(staticRoutes);

    // Ensure public directory exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    // Write sitemap to file
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');

    console.log(`✓ Sitemap generated successfully at ${sitemapPath}`);
    console.log(`✓ Total URLs: ${staticRoutes.length}`);
    console.log(`✓ Site URL: ${SITE_URL}`);
  } catch (error) {
    console.error('✗ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
