/**
 * serverApi.ts — Server-side only data fetching using Firebase Admin SDK.
 *
 * IMPORTANT: Import this ONLY in Astro page frontmatter (server-side).
 * Never import in client-side React components — use api.ts for those.
 *
 * Uses firebase-admin (via firebaseAdmin.js) so it works in Node.js SSR
 * without any browser polyfills.
 */
import { getFirestore } from './firebaseAdmin.js';
import { createRequire } from 'node:module';
const _require = createRequire(import.meta.url);

// Recursively convert Admin SDK Timestamps and plain objects to serializable types
function convertTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(convertTimestamps);

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof (v as any).toDate === 'function') {
      out[k] = (v as any).toDate().toISOString();
    } else if (v && typeof v === 'object') {
      out[k] = convertTimestamps(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function dbSnapshotToList(snapshot: any) {
  return snapshot.docs.map((d: any) => convertTimestamps({ id: d.id, ...d.data() }));
}

function getDb() {
  return getFirestore();
}

/** Strip HTML tags */
export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

/** Fetch a single document by slug */
export async function getDocBySlug(collectionName: string, slug: string) {
  try {
    const db = getDb() as any;
    const snapshot = await db
      .collection(collectionName)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return convertTimestamps({ id: d.id, ...d.data() });
  } catch (e: any) {
    console.error(`[serverApi] getDocBySlug(${collectionName}, ${slug}):`, e.message);
    return null;
  }
}

/** Fetch all published documents */
export async function getPublishedDocs(collectionName: string, limitCount = 100) {
  try {
    const db = getDb() as any;
    const snapshot = await db
      .collection(collectionName)
      .where('status', '==', 'published')
      .limit(limitCount)
      .get();
    return dbSnapshotToList(snapshot);
  } catch (e: any) {
    console.error(`[serverApi] getPublishedDocs(${collectionName}):`, e.message);
    return [];
  }
}

/** Fetch featured documents */
export async function getFeaturedDocs(collectionName: string, limitCount = 4) {
  try {
    const db = getDb() as any;
    const snapshot = await db
      .collection(collectionName)
      .where('status', '==', 'published')
      .where('is_featured', '==', true)
      .limit(limitCount)
      .get();
    return dbSnapshotToList(snapshot);
  } catch (e: any) {
    console.error(`[serverApi] getFeaturedDocs(${collectionName}):`, e.message);
    return [];
  }
}

/** Fetch recent posts, ordered by created_at desc */
export async function getRecentPosts(limitCount = 12) {
  try {
    const db = getDb() as any;
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'published')
      .orderBy('created_at', 'desc')
      .limit(limitCount)
      .get();
    return dbSnapshotToList(snapshot);
  } catch (e: any) {
    // Fallback without orderBy if index missing
    try {
      const db2 = getDb() as any;
      const snapshot2 = await db2
        .collection('posts')
        .where('status', '==', 'published')
        .limit(limitCount * 3)
        .get();
      const results = dbSnapshotToList(snapshot2);
      results.sort((a: any, b: any) => {
        const da = new Date(a.created_at || 0).getTime();
        const db3 = new Date(b.created_at || 0).getTime();
        return db3 - da;
      });
      return results.slice(0, limitCount);
    } catch (e2: any) {
      console.error('[serverApi] getRecentPosts fallback failed:', e2.message);
      return [];
    }
  }
}

/** Homepage stats */
export async function getPublicStats() {
  try {
    const db = getDb() as any;
    const [postsSnap, profilesSnap, listingsSnap, resourcesSnap] = await Promise.all([
      db.collection('posts').where('status', '==', 'published').count().get(),
      db.collection('profiles').where('status', '==', 'published').count().get(),
      db.collection('listings').where('status', '==', 'published').count().get(),
      db.collection('resources').where('status', '==', 'published').count().get(),
    ]);
    return {
      total_blog_posts: postsSnap.data().count,
      total_entrepreneurs: profilesSnap.data().count,
      total_listings: listingsSnap.data().count,
      total_resources: resourcesSnap.data().count,
    };
  } catch (e: any) {
    console.error('[serverApi] getPublicStats:', e.message);
    return {};
  }
}

/** Fetch categories */
export async function getCategories() {
  try {
    const db = getDb() as any;
    const snapshot = await db.collection('blog_categories').get();
    return dbSnapshotToList(snapshot);
  } catch (e: any) {
    console.error('[serverApi] getCategories:', e.message);
    return [];
  }
}

/** Fetch a document by ID */
export async function getDocById(collectionName: string, id: string) {
  try {
    const db = getDb() as any;
    const snap = await db.collection(collectionName).doc(id).get();
    if (!snap.exists) return null;
    return convertTimestamps({ id: snap.id, ...snap.data() });
  } catch (e: any) {
    console.error(`[serverApi] getDocById(${collectionName}, ${id}):`, e.message);
    return null;
  }
}

/** Generic collection query helper */
async function queryCollection(
  collectionName: string,
  filters: Array<[string, any, any]> = [],
  limitCount = 50,
  orderByField?: string,
  orderDir: 'asc' | 'desc' = 'desc'
) {
  try {
    const db = getDb() as any;
    let q = db.collection(collectionName);
    for (const [field, op, val] of filters) {
      q = q.where(field, op, val);
    }
    if (orderByField) {
      q = q.orderBy(orderByField, orderDir);
    }
    q = q.limit(limitCount);
    const snapshot = await q.get();
    return dbSnapshotToList(snapshot);
  } catch (e: any) {
    console.error(`[serverApi] queryCollection(${collectionName}):`, e.message);
    return [];
  }
}

// ─── Blog / Post API ─────────────────────────────────────────────────────────
export const postAPI = {
  list: (limit = 50) =>
    queryCollection('posts', [['status', '==', 'published']], limit, 'created_at', 'desc'),
  getBySlug: (slug: string) => getDocBySlug('posts', slug),
  getById: (id: string) => getDocById('posts', id),
  getByCategory: (catId: string, limit = 20) =>
    queryCollection('posts', [['status', '==', 'published'], ['category_id', '==', catId]], limit),
};

// ─── Profile / Entrepreneur API ───────────────────────────────────────────────
export const profileAPI = {
  list: (limit = 50) =>
    queryCollection('profiles', [['status', '==', 'published']], limit),
  getBySlug: (slug: string) => getDocBySlug('profiles', slug),
  get: async (slug: string) => {
    const doc = await getDocBySlug('profiles', slug);
    return { data: doc };
  },
  featured: (limit = 4) => getFeaturedDocs('profiles', limit),
};

// ─── Listing / Directory API ──────────────────────────────────────────────────
export const listingAPI = {
  list: (limit = 50) =>
    queryCollection('listings', [['status', '==', 'published']], limit),
  getBySlug: (slug: string) => getDocBySlug('listings', slug),
  get: async (slug: string) => {
    const doc = await getDocBySlug('listings', slug);
    return { data: doc };
  },
  featured: (limit = 4) => getFeaturedDocs('listings', limit),
};

// ─── Resource API ─────────────────────────────────────────────────────────────
export const resourceAPI = {
  list: (limit = 50) =>
    queryCollection('resources', [['status', '==', 'published']], limit),
  getBySlug: (slug: string) => getDocBySlug('resources', slug),
  featured: (limit = 6) => getFeaturedDocs('resources', limit),
};

// ─── Author API ───────────────────────────────────────────────────────────────
export const authorAPI = {
  getBySlug: (slug: string) => getDocBySlug('authors', slug),
  getById: (id: string) => getDocById('authors', id),
  get: async (id: string) => {
    const doc = await getDocById('authors', id);
    return { data: doc };
  },
  list: (limit = 50) => queryCollection('authors', [], limit),
};

// ─── Content / Knowledge API ──────────────────────────────────────────────────
export const contentAPI = {
  list: (limit = 50) =>
    queryCollection('resources', [['status', '==', 'published']], limit),
  getBySlug: (slug: string) => getDocBySlug('resources', slug),
};

// ─── Taxonomy API ─────────────────────────────────────────────────────────────
export const taxonomyAPI = {
  getCategories: () => getCategories(),
  getByCollection: (collectionName: string) => queryCollection(collectionName, [], 200),
  list: async (type: string) => {
    const colMap: any = {
      categories: 'categories',
      blog_categories: 'blog_categories',
      industries: 'industries',
      cities: 'cities'
    };
    const colName = colMap[type] || type;
    const data = await queryCollection(colName, [], 200);
    return { data };
  }
};

/** Increment a document's view count */
export async function incrementViewCount(collectionName: string, id: string) {
  try {
    const db = getDb() as any;
    
    let incValue: any;
    try {
      // 1. Try Firebase Admin SDK FieldValue
      const adminFs = _require('firebase-admin/firestore');
      incValue = adminFs.FieldValue.increment(1);
    } catch (e) {
      try {
        const admin = _require('firebase-admin');
        incValue = admin.firestore.FieldValue.increment(1);
      } catch (e2) {
        // 2. Try Client SDK fallback increment
        try {
          const { increment } = await import('firebase/firestore');
          incValue = increment(1);
        } catch (e3) {
          incValue = 1;
        }
      }
    }
    
    await db.collection(collectionName).doc(id).update({
      view_count: incValue
    });
  } catch (error: any) {
    console.warn(`[serverApi] Failed to increment view count for ${collectionName}/${id}:`, error.message);
  }
}
