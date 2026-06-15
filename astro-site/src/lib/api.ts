// Firestore data fetching utilities for Astro server-side rendering and client-side components
import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit as fsLimit, 
  getCountFromServer,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Helper to convert Firestore doc to standard object
const docToData = (doc: any) => {
  if (!doc.exists()) return null;
  const data = { id: doc.id, ...doc.data() };
  return convertTimestamps(data);
};

// Recursively convert Firestore Timestamps to JS Dates
const convertTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const converted = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in converted) {
    const value = converted[key];
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      converted[key] = value.toDate();
    } else if (value && typeof value === 'object') {
      converted[key] = convertTimestamps(value);
    }
  }
  return converted;
};

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
  return convertTimestamps({ id: docSnap.id, ...docSnap.data() });
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
  return snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
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
  return snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
}

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
    return snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
  } catch (e) {
    // Fallback: fetch all published, sort manually, and slice (handles missing composite index)
    const unsortedQ = query(
      collection(db, 'posts'),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(unsortedQ);
    const results = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
    
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
  return snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
}

// --- RESTORED CLIENT/LEGACY API HANDLERS ---

export const settingsAPI = {
  get: async () => {
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    return { data: docSnap.exists() ? docToData(docSnap) : {} };
  },
  update: async (data: any) => {
    await setDoc(doc(db, 'settings', 'global'), { ...data, updated_at: serverTimestamp() }, { merge: true });
    return { success: true };
  }
};

export const codeSnippetsAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'code_snippets'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Code snippets list error:', error);
      return { data: [] };
    }
  }
};

export const listingAPI = {
  list: async (params: any = {}) => {
    try {
      let constraints = [];
      if (params.status && params.status !== 'all') {
        constraints.push(where('status', '==', params.status));
      } else if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      if (params.is_featured === true) {
        constraints.push(where('is_featured', '==', true));
      }
      if (params.listing_type) {
        constraints.push(where('listing_type', '==', params.listing_type));
      }
      let q = constraints.length > 0 
        ? query(collection(db, 'listings'), ...constraints)
        : collection(db, 'listings');
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter((l: any) => 
          l.business_name?.toLowerCase().includes(search) || 
          l.founder_name?.toLowerCase().includes(search) || 
          l.ceo_name?.toLowerCase().includes(search) ||
          l.leadership_team?.founder?.name?.toLowerCase().includes(search) ||
          l.leadership_team?.ceo?.name?.toLowerCase().includes(search)
        );
      }
      if (params.category && params.category !== 'all') {
        const cat = params.category.toLowerCase();
        data = data.filter((l: any) => 
          l.category?.toLowerCase() === cat || 
          l.category_id?.toLowerCase() === cat || 
          l.category_name?.toLowerCase() === cat ||
          l.category_slug?.toLowerCase() === cat
        );
      }
      return { data };
    } catch (error) {
      console.error('Firestore Listing List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug: string) => {
    try {
      const q = query(collection(db, 'listings'), where('slug', '==', slug), fsLimit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      const listDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'listings', listDoc.id), {
        view_count: increment(1)
      }).catch(err => console.warn('Failed to increment view count:', err));
      return { data: docToData(listDoc) };
    } catch (error) {
      console.error('Firestore Listing Get Error:', error);
      throw error;
    }
  }
};

export const profileAPI = {
  list: async (params: any = {}) => {
    try {
      let constraints = [];
      if (params.status && params.status !== 'all') {
        constraints.push(where('status', '==', params.status));
      } else if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      if (params.is_featured === true) {
        constraints.push(where('is_featured', '==', true));
      }
      let q = constraints.length > 0 
        ? query(collection(db, 'profiles'), ...constraints)
        : collection(db, 'profiles');
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter((p: any) => 
          p.name?.toLowerCase().includes(search) || 
          p.company_name?.toLowerCase().includes(search) ||
          p.designation?.toLowerCase().includes(search) ||
          p.role_title?.toLowerCase().includes(search)
        );
      }
      if (params.industry && params.industry !== 'all') {
        const ind = params.industry.toLowerCase();
        data = data.filter((p: any) => 
          p.industry?.toLowerCase() === ind ||
          p.industry_name?.toLowerCase() === ind
        );
      }
      if (params.city && params.city !== 'all') {
        const city = params.city.toLowerCase();
        data = data.filter((p: any) => 
          p.city?.toLowerCase() === city ||
          p.headquarters?.toLowerCase().includes(city)
        );
      }
      return { data };
    } catch (error) {
      console.error('Firestore Profile List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug: string) => {
    try {
      const q = query(collection(db, 'profiles'), where('slug', '==', slug), fsLimit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      const profileDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'profiles', profileDoc.id), {
        view_count: increment(1)
      }).catch(err => console.warn('Failed to increment view count:', err));
      return { data: docToData(profileDoc) };
    } catch (error) {
      console.error('Firestore Profile Get Error:', error);
      throw error;
    }
  }
};

export const taxonomyAPI = {
  list: async (type: string) => {
    const colMap: any = {
      categories: 'categories',
      blog_categories: 'blog_categories',
      industries: 'industries',
      cities: 'cities'
    };
    const colName = colMap[type] || type;
    const snapshot = await getDocs(collection(db, colName));
    return { data: snapshot.docs.map(docToData) };
  },
  create: async (type: string, name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const docRef = await addDoc(collection(db, type), { 
      name, 
      slug,
      created_at: serverTimestamp() 
    });
    return { id: docRef.id, name, slug };
  },
  delete: async (type: string, id: string) => {
    await deleteDoc(doc(db, type, id));
    return { success: true };
  }
};

export const categoryAPI = {
  list: () => taxonomyAPI.list('categories'),
  create: (name: string) => taxonomyAPI.create('categories', name)
};

export const blogCategoryAPI = {
  list: () => taxonomyAPI.list('blog_categories'),
  create: (name: string) => taxonomyAPI.create('blog_categories', name)
};

export const industryAPI = {
  list: () => taxonomyAPI.list('industries')
};

export const cityAPI = {
  list: () => taxonomyAPI.list('cities')
};

export const resourceAPI = {
  list: async () => {
    const snapshot = await getDocs(collection(db, 'resources'));
    return { data: snapshot.docs.map(docToData) };
  },
  get: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'resources', id));
    return { data: docToData(docSnap) };
  }
};

export const faqCategoriesAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'faq_categories'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('FAQ categories list error:', error);
      return { data: [] };
    }
  }
};

export const guidesAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'guides'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Guides list error:', error);
      return { data: [] };
    }
  }
};

export const glossaryAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'glossary'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Glossary list error:', error);
      return { data: [] };
    }
  }
};

export const mediaAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'media'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Media list error:', error);
      return { data: [] };
    }
  },
  deleteR2: async (key: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/media-handler?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete R2 image: ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('R2 Delete API Error:', error);
      throw error;
    }
  }
};

export const deadLinkAPI = {
  log: async (path: string) => {
    try {
      const id = path.replace(/[\/\.]/g, '_') || 'root';
      const docRef = doc(db, 'dead_links', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          hit_count: increment(1),
          last_hit: serverTimestamp()
        });
      } else {
        await setDoc(docRef, {
          path,
          hit_count: 1,
          created_at: serverTimestamp(),
          last_hit: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn('Silent 404 Logging Failed:', e);
    }
  }
};

export const authorAPI = {
  list: async () => {
    try {
      const q = query(collection(db, 'authors'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
       console.error('Error listing authors:', error);
       return { data: [] };
    }
  },
  get: async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'authors', id));
      return { data: docToData(docSnap) };
    } catch (error) {
      console.error('Error getting author:', error);
      throw error;
    }
  },
  getBySlug: async (slug: string) => {
    try {
      const q = query(collection(db, 'authors'), where('slug', '==', slug), fsLimit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      return { data: docToData(snapshot.docs[0]) };
    } catch (error) {
      console.error('Error getting author by slug:', error);
      throw error;
    }
  },
  create: async (data: any) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await addDoc(collection(db, 'authors'), {
      ...data,
      slug,
      created_at: serverTimestamp()
    });
    return { id: res.id, ...data, slug };
  },
  update: async (id: string, data: any) => {
    const ref = doc(db, 'authors', id);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await updateDoc(ref, {
      ...data,
      slug,
      updated_at: serverTimestamp()
    });
    return { id, ...data, slug };
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'authors', id));
    return { success: true };
  }
};

export const postAPI = {
  list: async (params: any = {}) => {
    try {
      let constraints = [];
      if (params.category_id && params.category_id !== 'all') {
        constraints.push(where('category_id', '==', params.category_id));
      }
      if (params.status && params.status !== 'all') {
        constraints.push(where('status', '==', params.status));
      } else if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      if (params.is_featured === true) {
        constraints.push(where('is_featured', '==', true));
      }

      let sortedResults: any[] = [];
      try {
        const sortedQ = constraints.length > 0
          ? query(collection(db, 'posts'), ...constraints, orderBy('created_at', 'desc'))
          : query(collection(db, 'posts'), orderBy('created_at', 'desc'));
        const sortedSnap = await getDocs(sortedQ);
        sortedResults = sortedSnap.docs.map(docToData);
      } catch (e) {
        // Missing index fallback
      }

      const unsortedQ = constraints.length > 0
        ? query(collection(db, 'posts'), ...constraints)
        : collection(db, 'posts');
      const unsortedSnap = await getDocs(unsortedQ);
      const unsortedResults = unsortedSnap.docs.map(docToData);

      const seenIds = new Set(sortedResults.map(r => r.id));
      const legacyOnly = unsortedResults.filter(r => !seenIds.has(r.id));
      const merged = [...sortedResults, ...legacyOnly];

      merged.sort((a: any, b: any) => {
        const da = new Date(a.created_at || a.createdAt || 0);
        const db2 = new Date(b.created_at || b.createdAt || 0);
        return db2.getTime() - da.getTime();
      });

      if (params.limit) {
        return { data: merged.slice(0, params.limit) };
      }
      return { data: merged };
    } catch (error) {
      console.error('Firestore Posts List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug: string) => {
    try {
      const q = query(collection(db, 'posts'), where('slug', '==', slug), fsLimit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      const postDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'posts', postDoc.id), {
        view_count: increment(1)
      }).catch(err => console.warn('Failed to increment view count:', err));
      return { data: docToData(postDoc) };
    } catch (error) {
      console.error('Firestore Post Get Error:', error);
      throw error;
    }
  }
};

export const commentAPI = {
  list: async (contentType: string, contentId: string) => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('content_type', '==', contentType),
        where('content_id', '==', contentId)
      );
      const snapshot = await getDocs(q);
      const allComments = snapshot.docs.map(docToData);
      allComments.sort((a: any, b: any) => {
        const da = new Date(a.created_at || a.createdAt || 0);
        const db2 = new Date(b.created_at || b.createdAt || 0);
        return db2.getTime() - da.getTime();
      });
      return { data: allComments };
    } catch (error) {
      console.error('Comments List Error:', error);
      return { data: [] };
    }
  },
  create: async (data: any, turnstileToken: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: turnstileToken,
          commentData: data
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return { 
        data: { 
          id: result.id, 
          ...data, 
          created_at: new Date() 
        } 
      };
    } catch (error) {
      console.error('Comment Create Error:', error);
      throw error;
    }
  }
};

export const interactionAPI = {
  toggleLike: async (type: string, id: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');
    
    const likeId = `${user.uid}_${id}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeSnap = await getDoc(likeRef);
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const postRef = doc(db, colName, id);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { like_count: increment(-1) });
      return { data: { liked: false } };
    } else {
      await setDoc(likeRef, {
        userId: user.uid,
        contentId: id,
        type,
        created_at: serverTimestamp()
      });
      await updateDoc(postRef, { like_count: increment(1) });
      return { data: { liked: true } };
    }
  },

  checkLike: async (type: string, id: string) => {
    const user = auth.currentUser;
    if (!user) return { data: { liked: false } };
    const likeSnap = await getDoc(doc(db, 'likes', `${user.uid}_${id}`));
    return { data: { liked: likeSnap.exists() } };
  },

  toggleBookmark: async (type: string, id: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');
    
    const bookmarkRef = doc(db, 'bookmarks', `${user.uid}_${id}`);
    const snap = await getDoc(bookmarkRef);

    if (snap.exists()) {
      await deleteDoc(bookmarkRef);
      return { data: { bookmarked: false } };
    } else {
      await setDoc(bookmarkRef, {
        userId: user.uid,
        contentId: id,
        type,
        created_at: serverTimestamp()
      });
      return { data: { bookmarked: true } };
    }
  },

  checkBookmark: async (type: string, id: string) => {
    const user = auth.currentUser;
    if (!user) return { data: { bookmarked: false } };
    const snap = await getDoc(doc(db, 'bookmarks', `${user.uid}_${id}`));
    return { data: { bookmarked: snap.exists() } };
  },

  toggleFollow: async (profileId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');
    const followRef = doc(db, 'followers', `${user.uid}_${profileId}`);
    const profileRef = doc(db, 'profiles', profileId);
    const snap = await getDoc(followRef);

    if (snap.exists()) {
      await deleteDoc(followRef);
      await updateDoc(profileRef, { follower_count: increment(-1) });
      return { data: { following: false } };
    } else {
      await setDoc(followRef, { userId: user.uid, profileId, created_at: serverTimestamp() });
      await updateDoc(profileRef, { follower_count: increment(1) });
      return { data: { following: true } };
    }
  },

  checkFollow: async (profileId: string) => {
    const user = auth.currentUser;
    if (!user) return { data: { following: false } };
    const snap = await getDoc(doc(db, 'followers', `${user.uid}_${profileId}`));
    return { data: { following: snap.exists() } };
  }
};

export const contentAPI = {
  list: async (type: string) => {
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const snapshot = await getDocs(collection(db, colName));
    return { data: snapshot.docs.map(docToData) };
  },
  get: async (type: string, id: string) => {
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    let docRef = doc(db, colName, id);
    let docSnap = await getDoc(docRef);
    
    // Fallback for legacy AI posts
    if (!docSnap.exists() && (type === 'blog' || type === 'knowledge')) {
      const aiRef = doc(db, 'ai_posts', id);
      const aiSnap = await getDoc(aiRef);
      if (aiSnap.exists()) {
        docSnap = aiSnap;
        docRef = aiRef;
      }
    }

    if (docSnap.exists()) {
      // Update view count
      await updateDoc(docRef, {
        view_count: increment(1)
      }).catch(err => console.warn('Failed to increment view count:', err));
    }
    
    return { data: docToData(docSnap) };
  },
  create: async (payload: any) => {
    const { type, ...data } = payload;
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const res = await addDoc(collection(db, colName), {
      ...data,
      authorId: data.authorId || null,
      faqs: data.faqs || [],
      created_at: serverTimestamp()
    });
    return { id: res.id, ...data };
  },
  update: async (id: string, payload: any) => {
    const { type, ...data } = payload;
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const ref = doc(db, colName, id);
    
    // Check if we are migrating from ai_posts
    const aiRef = doc(db, 'ai_posts', id);
    const aiSnap = await getDoc(aiRef);
    
    // Use setDoc with merge: true to allow "Migration on Save"
    await setDoc(ref, { 
      ...data, 
      authorId: data.authorId || null,
      faqs: data.faqs || [],
      updated_at: serverTimestamp() 
    }, { merge: true });

    // Clean up legacy if migrated
    if (aiSnap.exists() && colName !== 'ai_posts') {
      await deleteDoc(aiRef).catch(err => console.warn('Cleanup of ai_posts failed:', err));
    }

    return { id, ...data };
  },
  delete: async (type: string, id: string) => {
    const collectionMap: any = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    await deleteDoc(doc(db, colName, id));
    return { success: true };
  }
};

// --- Admin API ---
export const adminAPI = {
  getStats: async () => {
    try {
      const [postsSnap, profilesSnap, listingsSnap, resourcesSnap, usersSnap, pendingProfilesSnap, pendingListingsSnap, reportsSnap] = await Promise.all([
        getDocs(collection(db, 'posts')),
        getDocs(collection(db, 'profiles')),
        getDocs(collection(db, 'listings')),
        getDocs(collection(db, 'resources')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'profiles'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'listings'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'comment_reports'), where('status', '==', 'pending')))
      ]);

      const pendingPublicProfiles = pendingProfilesSnap.docs.filter(d => d.data().source === 'public').length;
      const pendingPublicListings = pendingListingsSnap.docs.filter(d => d.data().source === 'public').length;

      return {
        data: {
          total_blog_posts: postsSnap.size,
          total_entrepreneurs: profilesSnap.size,
          total_listings: listingsSnap.size,
          total_resources: resourcesSnap.size,
          total_users: usersSnap.size,
          pending_profiles: pendingProfilesSnap.size,
          pending_listings: pendingListingsSnap.size,
          pending_approvals: pendingProfilesSnap.size + pendingListingsSnap.size,
          pending_public_submissions: pendingPublicProfiles + pendingPublicListings,
          pending_reports: reportsSnap.size
        }
      };
    } catch (error) {
      console.error('Admin Stats Error:', error);
      return { data: { total_blog_posts: 0, total_entrepreneurs: 0, total_listings: 0, total_resources: 0, total_users: 0, pending_approvals: 0 } };
    }
  },
  approve: async (type: string, id: string) => {
    const collectionMap: any = {
      blog: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;
    await updateDoc(doc(db, colName, id), { status: 'published' });
    return { success: true };
  },
  reject: async (type: string, id: string) => {
    const collectionMap: any = {
      blog: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;
    await updateDoc(doc(db, colName, id), { status: 'rejected' });
    return { success: true };
  },
  setStatus: async (type: string, id: string, status: string) => {
    const collectionMap: any = {
      blog: 'posts',
      profile: 'profiles',
      listing: 'listings',
      knowledge: 'resources',
      entrepreneurs: 'profiles',
      directory: 'listings'
    };
    const colName = collectionMap[type] || type;
    await updateDoc(doc(db, colName, id), { status, updated_at: serverTimestamp() });
    return { success: true };
  },
  getPending: async () => {
    try {
      const qProfiles = query(collection(db, 'profiles'), where('status', '==', 'pending'));
      const qListings = query(collection(db, 'listings'), where('status', '==', 'pending'));
      
      const [profilesSnap, listingsSnap] = await Promise.all([
        getDocs(qProfiles),
        getDocs(qListings)
      ]);

      return {
        data: {
          profiles: profilesSnap.docs.map(docToData),
          listings: listingsSnap.docs.map(docToData)
        }
      };
    } catch (error) {
      console.error('Error fetching pending items:', error);
      return { data: { profiles: [], listings: [] } };
    }
  },
  getReports: async () => {
    try {
      const q = query(collection(db, 'comment_reports'), where('status', '==', 'pending'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      
      const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const reportsWithComments = await Promise.all(reports.map(async (report: any) => {
        try {
          const commentSnap = await getDoc(doc(db, 'comments', report.comment_id));
          return {
            ...report,
            comment: commentSnap.exists() ? { id: commentSnap.id, ...commentSnap.data() } : null
          };
        } catch (e) {
          return { ...report, comment: null };
        }
      }));
      
      return { data: reportsWithComments };
    } catch (error) {
      console.error('Get Reports Error:', error);
      throw error;
    }
  },
  resolveReport: async (reportId: string, action: string) => {
    try {
      const reportRef = doc(db, 'comment_reports', reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) throw new Error('Report not found');
      const reportData: any = reportSnap.data();

      if (action === 'delete_comment') {
        await deleteDoc(doc(db, 'comments', reportData.comment_id));
        const q = query(collection(db, 'comment_reports'), where('comment_id', '==', reportData.comment_id));
        const reportsSnap = await getDocs(q);
        await Promise.all(reportsSnap.docs.map(d => updateDoc(d.ref, { status: 'resolved', resolved_at: serverTimestamp() })));
      } else {
        await updateDoc(reportRef, { status: 'dismissed', resolved_at: serverTimestamp() });
      }

      return { success: true };
    } catch (error) {
      console.error('Resolve Report Error:', error);
      throw error;
    }
  },
  getUsers: async (params: any = {}) => {
    try {
      let q: any = collection(db, 'users');
      if (params.role && params.role !== 'all') {
        q = query(q, where('role', '==', params.role));
      }
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter((u: any) => u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
      }
      return { data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [] };
    }
  },
  updateUserRole: async (userId: string, newRole: string) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    return { success: true };
  },
  deleteUser: async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  },
  updateUserStatus: async (userId: string, isVerified: boolean) => {
    await updateDoc(doc(db, 'users', userId), { is_verified: isVerified });
    return { success: true };
  }
};

// --- Redirects API ---
export const redirectAPI = {
  list: async () => {
    try {
      const q = query(collection(db, 'redirects'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Redirects List Error:', error);
      return { data: [] };
    }
  },
  create: async (data: any) => {
    const res = await addDoc(collection(db, 'redirects'), {
      ...data,
      created_at: serverTimestamp(),
      hit_count: 0
    });
    return { id: res.id, ...data };
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'redirects', id));
    return { success: true };
  }
};

// --- Public Stats API ---
export const publicAPI = {
  getStats: async () => {
    try {
      const [postsSnap, profilesSnap, listingsSnap, resourcesSnap] = await Promise.all([
        getCountFromServer(query(collection(db, 'posts'), where('status', '==', 'published'))),
        getCountFromServer(query(collection(db, 'profiles'), where('status', '==', 'published'))),
        getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'published'))),
        getCountFromServer(query(collection(db, 'resources'), where('status', '==', 'published')))
      ]);
      return {
        data: {
          total_blog_posts: postsSnap.data().count,
          total_entrepreneurs: profilesSnap.data().count,
          total_listings: listingsSnap.data().count,
          total_resources: resourcesSnap.data().count,
        }
      };
    } catch (error) {
      console.error('Public Stats Error:', error);
      return { data: {} };
    }
  }
};

// --- Auth API (stub — auth is managed via Firebase directly in auth.jsx) ---
export const authAPI = {
  login: () => Promise.resolve({ data: {} }),
  register: () => Promise.resolve({ data: {} })
};

const apiDefault = {
  postAPI, profileAPI, listingAPI, contentAPI, interactionAPI, 
  adminAPI, publicAPI, commentAPI, resourceAPI, authAPI, categoryAPI, 
  blogCategoryAPI, industryAPI, cityAPI, taxonomyAPI, settingsAPI, authorAPI, mediaAPI,
  guidesAPI, faqCategoriesAPI, glossaryAPI, codeSnippetsAPI, redirectAPI,
  get: async (url: string) => {
    if (url === '/pages') {
      const snapshot = await getDocs(collection(db, 'pages'));
      return { data: snapshot.docs.map(docToData) };
    }
    if (url.startsWith('/pages/')) {
      const slugOrId = url.substring('/pages/'.length);
      const docRef = doc(db, 'pages', slugOrId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { data: docToData(docSnap) };
      }
      const q = query(collection(db, 'pages'), where('slug', '==', slugOrId), fsLimit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { data: docToData(snapshot.docs[0]) };
      }
      return { data: null };
    }
    throw new Error(`Unsupported GET path in general api wrapper: ${url}`);
  },
  delete: async (url: string) => {
    if (url.startsWith('/pages/')) {
      const id = url.substring('/pages/'.length);
      await deleteDoc(doc(db, 'pages', id));
      return { success: true };
    }
    throw new Error(`Unsupported DELETE path in general api wrapper: ${url}`);
  }
};

export default apiDefault;



