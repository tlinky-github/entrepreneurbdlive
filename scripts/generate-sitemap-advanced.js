#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://entrepreneurs.bd';
const API_URL = process.env.API_URL || 'https://api.entrepreneurs.bd';
const PUBLIC_DIR = path.join(__dirname, '../public');
const INCLUDE_DYNAMIC = process.env.INCLUDE_DYNAMIC === 'true';
const POSTS_DIR = path.join(__dirname, '../src/content/posts');
const DATA_DIR = path.join(__dirname, '../src/data');
const args = process.argv.slice(2);
const WATCH_MODE = args.includes('--watch');

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
 * Fetch dynamic routes from API
 */
async function fetchDynamicRoutes() {
  const dynamicRoutes = [];

  try {
    // Fetch blog posts
    console.log('  Fetching blog posts...');
    const postsResponse = await fetch(`${API_URL}/posts?limit=1000`);
    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      const postRoutes = (posts.data || []).map(post => ({
        url: `/blog/${post.slug}`,
        changefreq: 'weekly',
        priority: 0.8
      }));
      dynamicRoutes.push(...postRoutes);
      console.log(`    ✓ Added ${postRoutes.length} blog posts`);
    }
  } catch (error) {
    console.warn('  ⚠ Could not fetch blog posts:', error.message);
  }

  try {
    // Fetch entrepreneurs
    console.log('  Fetching entrepreneurs...');
    const entrepreneursResponse = await fetch(`${API_URL}/profiles?limit=1000`);
    if (entrepreneursResponse.ok) {
      const entrepreneurs = await entrepreneursResponse.json();
      const entrepreneurRoutes = (entrepreneurs.data || []).map(entrepreneur => ({
        url: `/entrepreneurs/${entrepreneur.slug}`,
        changefreq: 'weekly',
        priority: 0.7
      }));
      dynamicRoutes.push(...entrepreneurRoutes);
      console.log(`    ✓ Added ${entrepreneurRoutes.length} entrepreneurs`);
    }
  } catch (error) {
    console.warn('  ⚠ Could not fetch entrepreneurs:', error.message);
  }

  try {
    // Fetch directory listings
    console.log('  Fetching directory listings...');
    const listingsResponse = await fetch(`${API_URL}/listings?limit=1000`);
    if (listingsResponse.ok) {
      const listings = await listingsResponse.json();
      const listingRoutes = (listings.data || []).map(listing => ({
        url: `/directory/${listing.slug}`,
        changefreq: 'weekly',
        priority: 0.7
      }));
      dynamicRoutes.push(...listingRoutes);
      console.log(`    ✓ Added ${listingRoutes.length} directory listings`);
    }
  } catch (error) {
    console.warn('  ⚠ Could not fetch directory listings:', error.message);
  }

  try {
    // Fetch knowledge articles
    console.log('  Fetching knowledge articles...');
    const knowledgeResponse = await fetch(`${API_URL}/knowledge?limit=1000`);
    if (knowledgeResponse.ok) {
      const knowledge = await knowledgeResponse.json();
      const knowledgeRoutes = (knowledge.data || []).map(article => ({
        url: `/knowledge/${article.slug}`,
        changefreq: 'weekly',
        priority: 0.7
      }));
      dynamicRoutes.push(...knowledgeRoutes);
      console.log(`    ✓ Added ${knowledgeRoutes.length} knowledge articles`);
    }
  } catch (error) {
    console.warn('  ⚠ Could not fetch knowledge articles:', error.message);
  }

  return dynamicRoutes;
}

/**
 * Fetch local MDX blog posts
 */
function fetchLocalPostRoutes() {
  const localRoutes = [];
  try {
    if (fs.existsSync(POSTS_DIR)) {
      console.log('  Scanning local blog posts...');
      const files = fs.readdirSync(POSTS_DIR);
      const mdxFiles = files.filter(file => file.endsWith('.mdx'));

      mdxFiles.forEach(file => {
        const slug = file.replace(/\.mdx$/, '');
        localRoutes.push({
          url: `/blog/${slug}`,
          changefreq: 'weekly',
          priority: 0.8
        });
      });
      console.log(`    ✓ Found ${localRoutes.length} local posts`);
    } else {
      console.warn(`  ⚠ Posts directory not found: ${POSTS_DIR}`);
    }
  } catch (error) {
    console.warn('  ⚠ Could not scan local posts:', error.message);
  }
  return localRoutes;
}

/**
 * Fetch routes from data files
 */
function fetchDataRoutes() {
  const dataRoutes = [];
  try {
    if (fs.existsSync(DATA_DIR)) {
      console.log('  Scanning data files...');

      // 1. Process blog-data.js for posts
      const blogDataPath = path.join(DATA_DIR, 'blog-data.js');
      if (fs.existsSync(blogDataPath)) {
        const content = fs.readFileSync(blogDataPath, 'utf-8');
        // Extract posts array content
        const postsMatch = content.split('export const posts = [')[1];
        if (postsMatch) {
          const postsContent = postsMatch.split('];')[0];
          // Find all slugs
          const slugRegex = /slug:\s*["']([^"']+)["']/g;
          let match;
          let count = 0;
          while ((match = slugRegex.exec(postsContent)) !== null) {
            dataRoutes.push({
              url: `/blog/${match[1]}`,
              changefreq: 'weekly',
              priority: 0.8
            });
            count++;
          }
          console.log(`    ✓ Found ${count} posts in blog-data.js`);
        }
      }

      // 2. Process mock.js for knowledge pages
      const mockDataPath = path.join(DATA_DIR, 'mock.js');
      if (fs.existsSync(mockDataPath)) {
        const content = fs.readFileSync(mockDataPath, 'utf-8');

        // Helper to extract IDs from a variable block
        const extractIds = (varName) => {
          const part = content.split(`export const ${varName} = [`)[1];
          if (!part) return 0;
          const block = part.split('];')[0];
          const idRegex = /id:\s*["']([^"']+)["']/g;
          let match;
          let count = 0;
          while ((match = idRegex.exec(block)) !== null) {
            dataRoutes.push({
              url: `/knowledge/${match[1]}`,
              changefreq: 'weekly',
              priority: 0.8
            });
            count++;
          }
          return count;
        };

        const count1 = extractIds('pillarPages');
        const count2 = extractIds('pillarPagesPart2');
        console.log(`    ✓ Found ${count1 + count2} knowledge articles in mock.js`);
      }

    }
  } catch (error) {
    console.warn('  ⚠ Could not scan data files:', error.message);
  }
  return dataRoutes;
}

/**
 * Main function to generate and write sitemap
 */
async function main() {
  try {
    console.log('🔄 Generating sitemap...\n');

    let allRoutes = [...staticRoutes];

    // Add local posts
    const localRoutes = fetchLocalPostRoutes();
    allRoutes = [...allRoutes, ...localRoutes];

    // Add data routes
    const dataRoutes = fetchDataRoutes();
    allRoutes = [...allRoutes, ...dataRoutes];

    // Fetch dynamic routes if enabled
    if (INCLUDE_DYNAMIC) {
      console.log('📡 Fetching dynamic routes from API...');
      const dynamicRoutes = await fetchDynamicRoutes();
      allRoutes = [...allRoutes, ...dynamicRoutes];
      console.log(`\n  Total dynamic routes added: ${dynamicRoutes.length}`);
    }

    // Deduplicate routes based on URL
    const uniqueRoutes = Array.from(new Map(allRoutes.map(item => [item.url, item])).values());

    // Create sitemap content
    const sitemapContent = generateSitemap(uniqueRoutes);

    // Ensure public directory exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    // Write sitemap to file
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');

    console.log('\n✓ Sitemap generated successfully');
    console.log(`  Location: ${sitemapPath}`);
    console.log(`  Total URLs: ${allRoutes.length}`);
    console.log(`  Site URL: ${SITE_URL}`);
    console.log(`  Static routes: ${staticRoutes.length}`);
    console.log(`  Local posts: ${localRoutes.length}`);
    console.log(`  Data routes: ${dataRoutes.length}`);
    if (INCLUDE_DYNAMIC) {
      console.log(`  Dynamic routes: ${allRoutes.length - staticRoutes.length - localRoutes.length - dataRoutes.length}`);
    }
  } catch (error) {
    console.error('✗ Error generating sitemap:', error.message);
    if (!WATCH_MODE) process.exit(1);
  }
}

// Watch mode implementation
if (WATCH_MODE) {
  console.log(`\n👀 Watch mode enabled. Monitoring ${POSTS_DIR} and ${DATA_DIR} for changes...`);

  const watchImpl = (dir) => {
    if (fs.existsSync(dir)) {
      let debounceTimer;
      fs.watch(dir, (eventType, filename) => {
        if (filename && (filename.endsWith('.mdx') || filename.endsWith('.js'))) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            console.log(`\n📝 Detected change in ${filename}. Regenerating sitemap...`);
            main();
          }, 500);
        }
      });
    } else {
      console.warn(`⚠ Cannot watch non-existent directory: ${dir}`);
    }
  };

  watchImpl(POSTS_DIR);
  watchImpl(DATA_DIR);
}

// Run the script immediately
main();
