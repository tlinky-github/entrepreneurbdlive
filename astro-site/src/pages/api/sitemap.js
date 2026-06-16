import { getFirestore } from '../../lib/firebaseAdmin.js';

async function getPublishedDocs(collectionName, limitCount = 1000) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collectionName)
      .where('status', '==', 'published')
      .limit(limitCount)
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
          data[key] = data[key].toDate();
        }
      }
      return { id: doc.id, ...data };
    });
  } catch (e) {
    console.error(`Error fetching ${collectionName} for sitemap:`, e);
    return [];
  }
}

const formatDate = (dateVal) => {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export async function GET() {
  const baseUrl = 'https://entrepreneurs.bd';

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/disclaimer',
    '/editorial',
    '/privacy',
    '/terms',
    '/submit',
    '/blog',
    '/directory',
    '/entrepreneurs',
    '/resources/faqs',
    '/resources/glossary',
    '/resources/guides'
  ];

  // Dynamic routes
  let posts = [];
  let listings = [];
  let profiles = [];

  try {
    posts = await getPublishedDocs('posts', 1000);
  } catch (e) {
    console.error('Failed to fetch posts for sitemap:', e);
  }

  try {
    listings = await getPublishedDocs('listings', 1000);
  } catch (e) {
    console.error('Failed to fetch listings for sitemap:', e);
  }

  try {
    profiles = await getPublishedDocs('profiles', 1000);
  } catch (e) {
    console.error('Failed to fetch profiles for sitemap:', e);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${formatDate(post.updatedAt || post.updated_at || post.createdAt || post.created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${listings.map(listing => `
  <url>
    <loc>${baseUrl}/directory/${listing.slug}</loc>
    <lastmod>${formatDate(listing.updatedAt || listing.updated_at || listing.createdAt || listing.created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  ${profiles.map(profile => `
  <url>
    <loc>${baseUrl}/entrepreneurs/${profile.slug}</loc>
    <lastmod>${formatDate(profile.updatedAt || profile.updated_at || profile.createdAt || profile.created_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemapXml.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    }
  });
}
