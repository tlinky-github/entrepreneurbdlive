// Firestore data fetching utilities for Astro server-side rendering
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit as fsLimit } from 'firebase/firestore';

/**
 * Fetch a single document by slug from a Firestore collection
 */
export async function getDocBySlug(collectionName: string, slug: string) {
  const q = query(
    collection(db, collectionName),
    where('slug', '==', slug),
    fsLimit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Fetch all published documents from a collection
 */
export async function getPublishedDocs(collectionName: string, limitCount = 100) {
  const q = query(
    collection(db, collectionName),
    where('status', '==', 'published'),
    fsLimit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch featured documents from a collection
 */
export async function getFeaturedDocs(collectionName: string, limitCount = 4) {
  const q = query(
    collection(db, collectionName),
    where('status', '==', 'published'),
    where('is_featured', '==', true),
    fsLimit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

import { getCountFromServer } from 'firebase/firestore';

/**
 * Fetch public stats for homepage
 */
export async function getPublicStats() {
  try {
    const [postsSnap, profilesSnap, listingsSnap, resourcesSnap] = await Promise.all([
      getCountFromServer(query(collection(db, 'posts'), where('status', '==', 'published'))),
      getCountFromServer(query(collection(db, 'profiles'), where('status', '==', 'published'))),
      getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'published'))),
      getCountFromServer(query(collection(db, 'resources'), where('status', '==', 'published')))
    ]);

    return {
      total_blog_posts: postsSnap.data().count,
      total_entrepreneurs: profilesSnap.data().count,
      total_listings: listingsSnap.data().count,
      total_resources: resourcesSnap.data().count,
    };
  } catch (error) {
    console.error('Public Stats Error:', error);
    return {};
  }
}

/**
 * Fetch recent published posts (for blog list, homepage)
 */
export async function getRecentPosts(limitCount = 12) {
  try {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('created_at', 'desc'),
      fsLimit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Fallback: fetch all published, sort manually, and slice (handles missing composite index)
    const unsortedQ = query(
      collection(db, 'posts'),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(unsortedQ);
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    results.sort((a: any, b: any) => {
      const da = new Date(a.created_at || a.createdAt || 0);
      const db2 = new Date(b.created_at || b.createdAt || 0);
      return db2.getTime() - da.getTime();
    });
    
    return results.slice(0, limitCount);
  }
}

/**
 * Strip HTML tags from a string (for meta descriptions)
 */
export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

/**
 * Fetch categories
 */
export async function getCategories() {
  const q = query(collection(db, 'blog_categories'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}
