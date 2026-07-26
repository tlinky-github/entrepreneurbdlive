import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy,
  serverTimestamp,
  increment,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Helper to convert Firestore doc to standard object
const docToData = (doc) => {
  if (!doc.exists()) return null;
  const data = { id: doc.id, ...doc.data() };
  return convertTimestamps(data);
};

// Recursively convert Firestore Timestamps to JS Dates
const convertTimestamps = (data) => {
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

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result === 'string') {
      const base64 = result.split(',')[1];
      resolve(base64);
    } else {
      reject(new Error('Unable to convert file to base64'));
    }
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// --- Blog Posts API ---
export const postAPI = {
  list: async (params = {}) => {
    try {
      let constraints = [];
      
      if (params.category_id && params.category_id !== 'all') {
        constraints.push(where('category_id', '==', params.category_id));
      }
      
      // Status: explicitly provided, or default to 'published' unless admin
      if (params.status && params.status !== 'all') {
        constraints.push(where('status', '==', params.status));
      } else if (!params.isAdmin) {
        constraints.push(where('status', '==', 'published'));
      }
      
      if (params.is_featured === true) {
        constraints.push(where('is_featured', '==', true));
      }

      // HYBRID: Try Firestore-sorted query first (fast path for new posts)
      let sortedResults = [];
      try {
        const sortedQ = constraints.length > 0
          ? query(collection(db, 'posts'), ...constraints, orderBy('created_at', 'desc'))
          : query(collection(db, 'posts'), orderBy('created_at', 'desc'));
        const sortedSnap = await getDocs(sortedQ);
        sortedResults = sortedSnap.docs.map(docToData);
      } catch (e) {
        // Composite index missing — that's okay, unsorted fallback will cover it
      }

      // FALLBACK: Also query without orderBy to catch legacy posts missing `created_at`
      const unsortedQ = constraints.length > 0
        ? query(collection(db, 'posts'), ...constraints)
        : collection(db, 'posts');
      const unsortedSnap = await getDocs(unsortedQ);
      const unsortedResults = unsortedSnap.docs.map(docToData);

      const seenIds = new Set(sortedResults.map(r => r.id));
      const legacyOnly = unsortedResults.filter(r => !seenIds.has(r.id));
      const rawMerged = [...sortedResults, ...legacyOnly];

      // Deduplicate by slug
      const uniqueMap = new Map();
      const duplicatesToDelete = [];

      for (const item of rawMerged) {
        if (!item.slug) {
          uniqueMap.set(`id_${item.id}`, item);
          continue;
        }
        const key = item.slug.toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        } else {
          const existing = uniqueMap.get(key);
          const getTime = (d) => d?.updated_at?.toDate ? d.updated_at.toDate().getTime() : (new Date(d?.updated_at || d?.created_at || 0).getTime());
          const itemTime = getTime(item);
          const existingTime = getTime(existing);

          if (itemTime > existingTime) {
            duplicatesToDelete.push(existing.id);
            uniqueMap.set(key, item);
          } else {
            duplicatesToDelete.push(item.id);
          }
        }
      }

      if (duplicatesToDelete.length > 0) {
        console.warn(`[postAPI] Auto-cleaning ${duplicatesToDelete.length} duplicate docs in posts collection...`);
        Promise.all(duplicatesToDelete.map(id => deleteDoc(doc(db, 'posts', id)).catch(() => {})));
      }

      const merged = Array.from(uniqueMap.values());

      // Final client-side sort (handles both created_at and createdAt)
      merged.sort((a, b) => {
        const da = new Date(a.created_at || a.createdAt || 0);
        const db2 = new Date(b.created_at || b.createdAt || 0);
        return db2 - da;
      });

      // Apply limit
      if (params.limit) {
        return { data: merged.slice(0, params.limit) };
      }

      return { data: merged };
    } catch (error) {
      console.error('Firestore Posts List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug) => {
    try {
      const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      
      // Update view count
      const postDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'posts', postDoc.id), {
        view_count: increment(1)
      });
      
      return { data: docToData(postDoc) };
    } catch (error) {
      console.error('Firestore Post Get Error:', error);
      throw error;
    }
  },
  create: async (data) => {
    const res = await addDoc(collection(db, 'posts'), {
      ...data,
      created_at: serverTimestamp(),
      view_count: 0
    });
    return { id: res.id, ...data };
  },
  update: async (id, data) => {
    const ref = doc(db, 'posts', id);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
    return { id, ...data };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'posts', id));
    return { success: true };
  }
};

// --- Entrepreneurs (Profiles) API ---
export const profileAPI = {
  list: async (params = {}) => {
    try {
      let constraints = [];
      
      // Status: explicitly provided or default to 'published' unless admin
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
        data = data.filter(p => 
          p.name?.toLowerCase().includes(search) || 
          p.company_name?.toLowerCase().includes(search) ||
          p.designation?.toLowerCase().includes(search) ||
          p.role_title?.toLowerCase().includes(search)
        );
      }

      return { data };
    } catch (error) {
      console.error('Firestore Profile List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug) => {
    try {
      const q = query(collection(db, 'profiles'), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      
      const profileDoc = snapshot.docs[0];
      // Update view count
      await updateDoc(doc(db, 'profiles', profileDoc.id), {
        view_count: increment(1)
      });
      
      return { data: docToData(profileDoc) };
    } catch (error) {
      console.error('Firestore Profile Get Error:', error);
      throw error;
    }
  },
  create: async (data) => {
    const res = await addDoc(collection(db, 'profiles'), {
      ...data,
      created_at: serverTimestamp(),
      follower_count: 0
    });
    return { id: res.id, ...data };
  },
  update: async (id, data) => {
    const ref = doc(db, 'profiles', id);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
    return { id, ...data };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'profiles', id));
    return { success: true };
  }
};

// --- Business Directory (Listings) API ---
export const listingAPI = {
  list: async (params = {}) => {
    try {
      let constraints = [];
      
      // Status: explicitly provided or default to 'published' unless admin
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
        data = data.filter(l => 
          l.business_name?.toLowerCase().includes(search) || 
          l.founder_name?.toLowerCase().includes(search) || 
          l.ceo_name?.toLowerCase().includes(search) ||
          l.leadership_team?.founder?.name?.toLowerCase().includes(search) ||
          l.leadership_team?.ceo?.name?.toLowerCase().includes(search)
        );
      }

      return { data };
    } catch (error) {
      console.error('Firestore Listing List Error:', error);
      return { data: [] };
    }
  },
  get: async (slug) => {
    try {
      const q = query(collection(db, 'listings'), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      
      // Update view count
      const listDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'listings', listDoc.id), {
        view_count: increment(1)
      });
      
      return { data: docToData(listDoc) };
    } catch (error) {
      console.error('Firestore Listing Get Error:', error);
      throw error;
    }
  },
  create: async (data) => {
    const res = await addDoc(collection(db, 'listings'), {
      ...data,
      created_at: serverTimestamp(),
      view_count: 0
    });
    return { id: res.id, ...data };
  },
  update: async (id, data) => {
    const ref = doc(db, 'listings', id);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
    return { id, ...data };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'listings', id));
    return { success: true };
  }
};

// --- General Content API (Used by ContentEditorPanel) ---
export const contentAPI = {
  list: async (type) => {
    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const snapshot = await getDocs(collection(db, colName));
    return { data: snapshot.docs.map(docToData) };
  },
  get: async (type, id) => {
    const collectionMap = {
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
  list: async (type = 'posts') => {
    try {
      const collectionMap = {
        blog: 'posts',
        entrepreneurs: 'profiles',
        directory: 'listings',
        knowledge: 'knowledge',
        guides: 'guides',
        faqs: 'faq_categories',
        glossary: 'glossary'
      };
      const colName = collectionMap[type] || type;
      const snapshot = await getDocs(collection(db, colName));
      const rawDocs = snapshot.docs.map(docToData);

      const uniqueMap = new Map();
      const duplicatesToDelete = [];

      for (const item of rawDocs) {
        if (!item.slug) {
          uniqueMap.set(`id_${item.id}`, item);
          continue;
        }
        const key = `${colName}_${item.slug.toLowerCase().trim()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        } else {
          const existing = uniqueMap.get(key);
          const getTime = (d) => d?.updated_at?.toDate ? d.updated_at.toDate().getTime() : (new Date(d?.updated_at || d?.created_at || 0).getTime());
          const itemTime = getTime(item);
          const existingTime = getTime(existing);

          if (itemTime > existingTime) {
            duplicatesToDelete.push(existing.id);
            uniqueMap.set(key, item);
          } else {
            duplicatesToDelete.push(item.id);
          }
        }
      }

      if (duplicatesToDelete.length > 0) {
        console.warn(`[contentAPI] Auto-cleaning ${duplicatesToDelete.length} duplicate docs in ${colName}...`);
        Promise.all(duplicatesToDelete.map(id => deleteDoc(doc(db, colName, id)).catch(() => {})));
      }

      return { data: Array.from(uniqueMap.values()) };
    } catch (error) {
      console.error(`contentAPI list error:`, error);
      return { data: [] };
    }
  },
  create: async (arg1, arg2) => {
    let type = 'posts';
    let data = {};
    if (typeof arg1 === 'string') {
      type = arg1;
      data = arg2 || {};
    } else {
      data = arg1 || {};
      type = data.type || 'posts';
    }

    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'knowledge',
      guides: 'guides',
      faqs: 'faq_categories',
      glossary: 'glossary'
    };
    const colName = collectionMap[type] || type;
    const cleanData = { ...data };
    delete cleanData.id;

    if (cleanData.slug) {
      try {
        const q = query(collection(db, colName), where('slug', '==', cleanData.slug.toLowerCase().trim()), fsLimit(1));
        const existingSnap = await getDocs(q);
        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          await updateDoc(doc(db, colName, existingDoc.id), {
            ...cleanData,
            updated_at: serverTimestamp()
          });
          return { id: existingDoc.id, ...cleanData };
        }
      } catch (e) {
        console.warn('[contentAPI.create] Upsert check failed:', e);
      }
    }

    const res = await addDoc(collection(db, colName), {
      ...cleanData,
      authorId: cleanData.authorId || null,
      faqs: cleanData.faqs || [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: res.id, ...cleanData };
  },
  update: async (arg1, arg2, arg3) => {
    let type = 'posts';
    let id = '';
    let data = {};

    if (typeof arg1 === 'string' && typeof arg2 === 'string' && arg3) {
      type = arg1;
      id = arg2;
      data = arg3;
    } else if (typeof arg1 === 'string' && arg2) {
      id = arg1;
      data = arg2;
      type = data.type || 'posts';
    }

    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'knowledge',
      guides: 'guides',
      faqs: 'faq_categories',
      glossary: 'glossary'
    };
    const colName = collectionMap[type] || type;
    const ref = doc(db, colName, id);
    const cleanData = { ...data };
    delete cleanData.id;
    
    await setDoc(ref, { 
      ...cleanData, 
      authorId: cleanData.authorId || null,
      faqs: cleanData.faqs || [],
      updated_at: serverTimestamp() 
    }, { merge: true });

    return { id, ...cleanData };
  },
  delete: async (arg1, arg2) => {
    let type = 'posts';
    let id = '';

    if (typeof arg1 === 'string' && typeof arg2 === 'string') {
      type = arg1;
      id = arg2;
    } else if (typeof arg1 === 'string') {
      id = arg1;
    }

    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'knowledge',
      guides: 'guides',
      faqs: 'faq_categories',
      glossary: 'glossary'
    };
    const colName = collectionMap[type] || type;
    await deleteDoc(doc(db, colName, id));
    return { success: true };
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
  },
  get: async (id) => {
    const docSnap = await getDoc(doc(db, 'faq_categories', id));
    return { data: docToData(docSnap) };
  },
  create: async (data) => {
    const docRef = await addDoc(collection(db, 'faq_categories'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id, data) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'faq_categories', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'faq_categories', id));
    return { success: true };
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
  },
  get: async (id) => {
    const docSnap = await getDoc(doc(db, 'guides', id));
    return { data: docToData(docSnap) };
  },
  create: async (data) => {
    const docRef = await addDoc(collection(db, 'guides'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id, data) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'guides', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'guides', id));
    return { success: true };
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
  },
  get: async (id) => {
    const docSnap = await getDoc(doc(db, 'glossary', id));
    return { data: docToData(docSnap) };
  },
  create: async (data) => {
    const docRef = await addDoc(collection(db, 'glossary'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id, data) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'glossary', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'glossary', id));
    return { success: true };
  }
};

// --- Interaction API ---
export const interactionAPI = {
  toggleLike: async (type, id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');
    
    const likeId = `${user.uid}_${id}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeSnap = await getDoc(likeRef);
    const collectionMap = {
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

  checkLike: async (type, id) => {
    const user = auth.currentUser;
    if (!user) return { data: { liked: false } };
    const likeSnap = await getDoc(doc(db, 'likes', `${user.uid}_${id}`));
    return { data: { liked: likeSnap.exists() } };
  },

  toggleBookmark: async (type, id) => {
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

  checkBookmark: async (type, id) => {
    const user = auth.currentUser;
    if (!user) return { data: { bookmarked: false } };
    const snap = await getDoc(doc(db, 'bookmarks', `${user.uid}_${id}`));
    return { data: { bookmarked: snap.exists() } };
  },

  toggleFollow: async (profileId) => {
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

  checkFollow: async (profileId) => {
    const user = auth.currentUser;
    if (!user) return { data: { following: false } };
    const snap = await getDoc(doc(db, 'followers', `${user.uid}_${profileId}`));
    return { data: { following: snap.exists() } };
  }
};

// --- Comment API ---
export const commentAPI = {
  list: async (contentType, contentId) => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('content_type', '==', contentType),
        where('content_id', '==', contentId)
      );
      const snapshot = await getDocs(q);
      const allComments = snapshot.docs.map(docToData);
      
      // Sort: newest first
      allComments.sort((a, b) => {
        const da = new Date(a.created_at || a.createdAt || 0);
        const db2 = new Date(b.created_at || b.createdAt || 0);
        return db2 - da;
      });

      return { data: allComments };
    } catch (error) {
      console.error('Comments List Error:', error);
      return { data: [] };
    }
  },
  create: async (data, turnstileToken) => {
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
  },
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
      return { success: true };
    } catch (error) {
      console.error('Comment Delete Error:', error);
      throw error;
    }
  },
  update: async (id, content) => {
    try {
      await updateDoc(doc(db, 'comments', id), {
        content,
        updated_at: serverTimestamp(),
        is_edited: true
      });
      return { success: true };
    } catch (error) {
      console.error('Comment Update Error:', error);
      throw error;
    }
  },
  report: async (commentId, reason) => {
    try {
      await addDoc(collection(db, 'comment_reports'), {
        comment_id: commentId,
        reason,
        status: 'pending',
        created_at: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Comment Report Error:', error);
      throw error;
    }
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
  approve: async (type, id) => {
    const collectionMap = {
      blog: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;
    await updateDoc(doc(db, colName, id), { status: 'published' });
    return { success: true };
  },
  reject: async (type, id) => {
    const collectionMap = {
      blog: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;
    await updateDoc(doc(db, colName, id), { status: 'rejected' });
    return { success: true };
  },
  setStatus: async (type, id, status) => {
    const collectionMap = {
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
      const reportsWithComments = await Promise.all(reports.map(async (report) => {
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
  resolveReport: async (reportId, action) => {
    try {
      const reportRef = doc(db, 'comment_reports', reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) throw new Error('Report not found');
      const reportData = reportSnap.data();

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
  getUsers: async (params = {}) => {
    try {
      let q = collection(db, 'users');
      if (params.role && params.role !== 'all') {
        q = query(q, where('role', '==', params.role));
      }
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter(u => u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search));
      }
      return { data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [] };
    }
  },
  updateUserRole: async (userId, newRole) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
    return { success: true };
  },
  deleteUser: async (userId) => {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  },
  updateUserStatus: async (userId, isVerified) => {
    await updateDoc(doc(db, 'users', userId), { is_verified: isVerified });
    return { success: true };
  }
};

// --- Public API ---
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

// Taxonomy API (Categories, Industries, Cities)
export const taxonomyAPI = {
  list: async (type) => {
    const colMap = {
      categories: 'categories',
      blog_categories: 'blog_categories',
      industries: 'industries',
      cities: 'cities'
    };
    const colName = colMap[type] || type;
    const snapshot = await getDocs(collection(db, colName));
    return { data: snapshot.docs.map(docToData) };
  },
  create: async (type, name) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const docRef = await addDoc(collection(db, type), { 
      name, 
      slug,
      created_at: serverTimestamp() 
    });
    return { id: docRef.id, name, slug };
  },
  delete: async (type, id) => {
    await deleteDoc(doc(db, type, id));
    return { success: true };
  }
};

// --- Authors API ---
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
  get: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, 'authors', id));
      return { data: docToData(docSnap) };
    } catch (error) {
      console.error('Error getting author:', error);
      throw error;
    }
  },
  getBySlug: async (slug) => {
    try {
      const q = query(collection(db, 'authors'), where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { data: null };
      return { data: docToData(snapshot.docs[0]) };
    } catch (error) {
      console.error('Error getting author by slug:', error);
      throw error;
    }
  },
  create: async (data) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await addDoc(collection(db, 'authors'), {
      ...data,
      slug,
      created_at: serverTimestamp()
    });
    return { id: res.id, ...data, slug };
  },
  update: async (id, data) => {
    const ref = doc(db, 'authors', id);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await updateDoc(ref, {
      ...data,
      slug,
      updated_at: serverTimestamp()
    });
    return { id, ...data, slug };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'authors', id));
    return { success: true };
  }
};

// --- Media Library API ---
export const mediaAPI = {
  list: async (params = {}) => {
    try {
      let q = collection(db, 'media');
      
      // Try with ordering first (requires index) unless noSort is requested
      try {
        let sortedQ = q;
        if (!params.noSort) {
          sortedQ = query(q, orderBy('created_at', 'desc'));
        }
        if (params.limit) {
          sortedQ = query(sortedQ, limit(params.limit));
        }
        const snapshot = await getDocs(sortedQ);
        return { data: snapshot.docs.map(docToData) };
      } catch (sortError) {
        console.warn('Media list sort failed (possibly missing index), falling back to unsorted:', sortError);
        const snapshot = await getDocs(q);
        return { data: snapshot.docs.map(docToData) };
      }
    } catch (error) {
      console.error('Error listing media:', error);
      return { data: [] };
    }
  },
  create: async (data) => {
    try {
      const res = await addDoc(collection(db, 'media'), {
        ...data,
        created_at: serverTimestamp()
      });
      return { id: res.id, ...data };
    } catch (error) {
      console.error('Error creating media entry:', error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'media', id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting media entry:', error);
      throw error;
    }
  },
  listR2: async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch('/api/media-handler?action=list', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to list R2 contents');
      return await response.json();
    } catch (error) {
      console.error('R2 List API Error:', error);
      throw error;
    }
  },
  deleteR2: async (key) => {
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
  },
  optimize: async (source, options = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const body = { ...options };
      if (source instanceof File) {
        body.fileBase64 = await fileToBase64(source);
        body.contentType = source.type;
        body.fileName = source.name;
      } else {
        body.sourceUrl = source;
      }

      const response = await fetch('/api/media-handler?action=optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to optimize image: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('R2 Optimize API Error:', error);
      throw error;
    }
  }
};

// Exporting actual implementations
export const categoryAPI = { 
  list: () => taxonomyAPI.list('categories'),
  create: (name) => taxonomyAPI.create('categories', name),
  delete: (id) => taxonomyAPI.delete('categories', id)
};
export const blogCategoryAPI = { 
  list: () => taxonomyAPI.list('blog_categories'),
  create: (name) => taxonomyAPI.create('blog_categories', name),
  delete: (id) => taxonomyAPI.delete('blog_categories', id)
};
export const industryAPI = { 
  list: () => taxonomyAPI.list('industries'),
  create: (name) => taxonomyAPI.create('industries', name),
  delete: (id) => taxonomyAPI.delete('industries', id)
};
export const cityAPI = { 
  list: () => taxonomyAPI.list('cities'),
  create: (name) => taxonomyAPI.create('cities', name),
  delete: (id) => taxonomyAPI.delete('cities', id)
};

export const resourceAPI = { list: () => contentAPI.list('knowledge'), get: (id) => contentAPI.get('knowledge', id) };
export const authAPI = { login: () => Promise.resolve({ data: {} }), register: () => Promise.resolve({ data: {} }) };
export const settingsAPI = { 
  get: async () => {
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    return { data: docSnap.exists() ? docToData(docSnap) : {} };
  },
  update: async (data) => {
    await setDoc(doc(db, 'settings', 'global'), { ...data, updated_at: serverTimestamp() }, { merge: true });
    return { success: true };
  }
};

// --- Code Snippets API (Page-Targeted Custom Code) ---
export const codeSnippetsAPI = {
  list: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'code_snippets'));
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Code snippets list error:', error);
      return { data: [] };
    }
  },
  create: async (data) => {
    const res = await addDoc(collection(db, 'code_snippets'), { ...data, created_at: serverTimestamp() });
    return { id: res.id, ...data };
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'code_snippets', id), { ...data, updated_at: serverTimestamp() });
    return { id, ...data };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'code_snippets', id));
    return { success: true };
  }
};

// --- Contact Messages API ---
export const contactAPI = {
  send: async (data) => {
    const docRef = await addDoc(collection(db, 'contact_messages'), {
      ...data,
      status: 'unread',
      created_at: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  },
  list: async () => {
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    } catch (error) {
      const snapshot = await getDocs(collection(db, 'contact_messages'));
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dbTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dbTime - da;
      });
      return { data: items };
    }
  },
  updateStatus: async (id, status) => {
    await updateDoc(doc(db, 'contact_messages', id), { status });
    return { success: true };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'contact_messages', id));
    return { success: true };
  }
};

export default { 
  postAPI, profileAPI, listingAPI, contentAPI, interactionAPI, 
  adminAPI, publicAPI, commentAPI, resourceAPI, authAPI, categoryAPI, 
  blogCategoryAPI, industryAPI, cityAPI, taxonomyAPI, settingsAPI, authorAPI, mediaAPI,
  guidesAPI, faqCategoriesAPI, glossaryAPI, codeSnippetsAPI, contactAPI
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
  create: async (data) => {
    const res = await addDoc(collection(db, 'redirects'), {
      ...data,
      created_at: serverTimestamp(),
      hit_count: 0
    });
    return { id: res.id, ...data };
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'redirects', id));
    return { success: true };
  }
};

// --- Dead Links API (404 Tracker) ---
export const deadLinkAPI = {
  list: async () => {
    try {
      const q = query(collection(db, 'dead_links'), orderBy('hit_count', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Dead Links List Error:', error);
      return { data: [] };
    }
  },
  log: async (path) => {
    try {
      // Use the path as ID to count hits for the same URL efficiently
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
  },
  delete: async (id) => {
    await deleteDoc(doc(db, 'dead_links', id));
    return { success: true };
  }
};
