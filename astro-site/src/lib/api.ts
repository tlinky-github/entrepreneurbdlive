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
 * Fetch recent published posts (for blog list, homepage)
 */
export async function getRecentPosts(limitCount = 12) {
  const q = query(
    collection(db, 'posts'),
    where('status', '==', 'published'),
    orderBy('created_at', 'desc'),
    fsLimit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Strip HTML tags from a string (for meta descriptions)
 */
export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}
