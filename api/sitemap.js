const axios = require('axios');

// --- CONFIG ---
const PROJECT_ID = process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.REACT_APP_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const SITE_URL = 'https://entrepreneurs.bd';

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
function createUrlEntry(baseUrl, changefreq, priority, lastmod) {
  const modDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchAllFirestoreDocs(collection) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        select: {
          fields: [{ fieldPath: 'slug' }, { fieldPath: 'status' }, { fieldPath: 'updated_at' }, { fieldPath: 'created_at' }]
        },
        limit: 1000
      }
    };
    
    const res = await axios.post(`${url}?key=${API_KEY}`, query, { timeout: 8000 });
    const docs = [];
    if (res.data) {
      for (const item of res.data) {
        if (item.document) {
           const fields = item.document.fields;
           if (fields && fields.slug && fields.slug.stringValue) {
              const status = fields.status && fields.status.stringValue;
              if (status === 'published') {
                 let modDate = null;
                 if (fields.updated_at && fields.updated_at.timestampValue) modDate = fields.updated_at.timestampValue;
                 else if (fields.created_at && fields.created_at.timestampValue) modDate = fields.created_at.timestampValue;
                 
                 docs.push({
                   slug: fields.slug.stringValue,
                   lastmod: modDate
                 });
              }
           }
        }
      }
    }
    return docs;
  } catch (e) {
    console.warn(`[Sitemap Firestore] Fail for ${collection}: ${e.message}`);
    return [];
  }
}

module.exports = async (req, res) => {
  try {
    let urlEntries = [];
    const seenUrls = new Set();

    const addEntry = (fullUrl, changefreq, priority, lastmod) => {
      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);
      urlEntries.push(createUrlEntry(fullUrl, changefreq, priority, lastmod));
    };

    // Add static routes
    for (const route of staticRoutes) {
       addEntry(`${SITE_URL}${route.url}`, route.changefreq, route.priority);
    }

    // Attempt to fetch dynamic routes if API key is present
    if (PROJECT_ID && API_KEY) {
      const collections = [
        { name: 'posts', prefix: '/blog', priority: 0.8, changefreq: 'weekly' },
        { name: 'profiles', prefix: '/entrepreneurs', priority: 0.8, changefreq: 'weekly' },
        { name: 'listings', prefix: '/directory', priority: 0.8, changefreq: 'weekly' },
        { name: 'resources', prefix: '/knowledge', priority: 0.8, changefreq: 'monthly' }
      ];

      for (const col of collections) {
         const items = await fetchAllFirestoreDocs(col.name);
         for (const item of items) {
            addEntry(`${SITE_URL}${col.prefix}/${item.slug}`, col.changefreq, col.priority, item.lastmod);
         }
      }
    }

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).send(sitemapContent);

  } catch (error) {
    console.error('[CRITICAL] Sitemap Generation Failure:', error.message);
    res.status(500).send('Internal Server Error generating sitemap.');
  }
};
