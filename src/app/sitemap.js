import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';
  const db = initializeFirebaseAdmin();

  // Define parallel fetch narratives
  const fetchCollections = [
    { coll: 'posts', path: 'blog', priority: 0.8 },
    { coll: 'profiles', path: 'entrepreneurs', priority: 0.7 },
    { coll: 'listings', path: 'directory', priority: 0.7 },
    { coll: 'knowledge', path: 'knowledge', priority: 0.6 }
  ];

  const dynamicRoutes = await Promise.all(fetchCollections.map(async ({ coll, path, priority }) => {
    try {
      // Filter for published content for SEO integrity
      const snap = await db.collection(coll).where('status', '==', 'published').get();
      
      return snap.docs.map(doc => ({
        url: `${baseUrl}/${path}/${doc.data().slug || doc.id}`,
        lastModified: doc.data().updated_at?.toDate() || new Date(),
        changeFrequency: 'weekly',
        priority,
      }));
    } catch (err) {
      console.error(`[Sitemap] Error fetching ${coll}:`, err.message);
      return []; // Return empty for this collection to maintain XML integrity
    }
  }));

  // Static narratives
  const staticRoutes = [
    '',
    '/blog',
    '/directory',
    '/entrepreneurs',
    '/knowledge',
    '/submit',
    '/about',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.9,
  }));

  return [...staticRoutes, ...dynamicRoutes.flat()];
}

// Ensure sitemap revalidation to keep index fresh
export const revalidate = 3600; // 1 hour
