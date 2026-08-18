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
  if (typeof data === 'string') {
    return data.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  if (!data || typeof data !== 'object') return data;
  
  const converted = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in converted) {
    const value = converted[key];
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      converted[key] = value.toDate();
    } else if (value && typeof value === 'object') {
      converted[key] = convertTimestamps(value);
    } else if (typeof value === 'string') {
      converted[key] = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
  }
  return converted;
};

const fileToBase64 = (file: File): Promise<string> => new Promise<string>((resolve, reject) => {
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


/**
 * Increment view count for a document on client side (session-deduplicated)
 */
export async function incrementViewCountClient(collectionName: string, id: string) {
  if (!id || typeof window === 'undefined') return;

  const collectionMap: Record<string, string> = {
    blog: 'posts',
    posts: 'posts',
    entrepreneurs: 'profiles',
    profiles: 'profiles',
    directory: 'listings',
    listings: 'listings',
    knowledge: 'knowledge',
    guides: 'guides',
    faqs: 'faq_categories',
    glossary: 'glossary',
    resources: 'resources'
  };
  const targetCol = collectionMap[collectionName] || collectionName;

  const storageKey = `viewed_${targetCol}_${id}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;

    const docRef = doc(db, targetCol, id);
    await updateDoc(docRef, {
      view_count: increment(1)
    });
    sessionStorage.setItem(storageKey, 'true');
  } catch (error: any) {
    // Silently ignore missing demo/mock documents that do not exist in Firestore
    if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
      return;
    }
    console.warn(`[incrementViewCountClient] Failed for ${targetCol}/${id}:`, error);
  }
}

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
  },
  create: async (data: any) => {
    const docRef = await addDoc(collection(db, 'code_snippets'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  },
  update: async (id: string, data: any) => {
    await updateDoc(doc(db, 'code_snippets', id), {
      ...data,
      updated_at: serverTimestamp()
    });
    return { success: true };
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'code_snippets', id));
    return { success: true };
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
  },
  delete: async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const response = await fetch(`/api/ai/ai-router?target=posts&id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) return { success: true };
        }
      }
    } catch (e) {
      console.warn('Server-side listing delete failed, trying client-side...', e);
    }
    await deleteDoc(doc(db, 'listings', id));
    return { success: true };
  },
  bulkUpdate: async (ids: string[], fields: Record<string, any>) => {
    await Promise.all(
      ids.map(id =>
        updateDoc(doc(db, 'listings', id), { ...fields, updated_at: serverTimestamp() })
      )
    );
    return { success: true };
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
  },
  delete: async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const response = await fetch(`/api/ai/ai-router?target=posts&id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) return { success: true };
        }
      }
    } catch (e) {
      console.warn('Server-side profile delete failed, trying client-side...', e);
    }
    await deleteDoc(doc(db, 'profiles', id));
    return { success: true };
  },
  bulkUpdate: async (ids: string[], fields: Record<string, any>) => {
    await Promise.all(
      ids.map(id =>
        updateDoc(doc(db, 'profiles', id), { ...fields, updated_at: serverTimestamp() })
      )
    );
    return { success: true };
  }
};

export const taxonomyAPI = {
  list: async (type: string) => {
    try {
      const colMap: any = {
        categories: 'categories',
        blog_categories: 'blog_categories',
        industries: 'industries',
        cities: 'cities',
        listing_types: 'listing_types',
        startup_stages: 'startup_stages',
        employee_sizes: 'employee_sizes'
      };
      const colName = colMap[type] || type;
      const snapshot = await getDocs(collection(db, colName));
      return { data: snapshot.docs.map(docToData) };
    } catch (e: any) {
      console.warn(`[taxonomyAPI] list(${type}) fallback on permission/fetch error:`, e.message);
      return { data: [] };
    }
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
  },
  delete: async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const response = await fetch(`/api/ai/ai-router?target=posts&id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) return { success: true };
        }
      }
    } catch (e) {
      console.warn('Server-side resource delete failed, trying client-side...', e);
    }
    await deleteDoc(doc(db, 'resources', id));
    return { success: true };
  }
};

const getCollectionName = (typeOrData?: any, optionalType?: string) => {
  const rawType = (typeof typeOrData === 'string' ? typeOrData : (typeOrData?.type || optionalType || 'posts')).toLowerCase();
  const map: Record<string, string> = {
    blog: 'posts',
    posts: 'posts',
    entrepreneurs: 'profiles',
    profiles: 'profiles',
    directory: 'listings',
    listings: 'listings',
    knowledge: 'knowledge',
    resources: 'resources',
    guides: 'guides',
    faqs: 'faq_categories',
    faq_categories: 'faq_categories',
    glossary: 'glossary'
  };
  return map[rawType] || rawType;
};

export const contentAPI = {
  list: async (type: string = 'posts') => {
    try {
      const colName = getCollectionName(type);
      const snapshot = await getDocs(collection(db, colName));
      const rawDocs = snapshot.docs.map(docToData);

      // Deduplicate by slug (keep most recent and delete duplicate copies in Firestore)
      const uniqueMap = new Map<string, any>();
      const duplicatesToDelete: string[] = [];

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
          const getTime = (d: any) => d?.updated_at?.toDate ? d.updated_at.toDate().getTime() : (new Date(d?.updated_at || d?.created_at || 0).getTime());
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
      console.error(`contentAPI list(${type}) error:`, error);
      return { data: [] };
    }
  },

  get: async (arg1: any, arg2?: any) => {
    try {
      let colName = 'posts';
      let idOrSlug = '';

      if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        colName = getCollectionName(arg1);
        idOrSlug = arg2;
      } else if (typeof arg1 === 'string') {
        idOrSlug = arg1;
      }

      if (!idOrSlug) return { data: null };

      try {
        const docSnap = await getDoc(doc(db, colName, idOrSlug));
        if (docSnap.exists()) {
          return { data: docToData(docSnap) };
        }
      } catch (e) {}

      const q = query(collection(db, colName), where('slug', '==', idOrSlug), fsLimit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { data: docToData(snapshot.docs[0]) };
      }

      return { data: null };
    } catch (error) {
      console.error(`contentAPI get error:`, error);
      return { data: null };
    }
  },

  create: async (arg1: any, arg2?: any) => {
    try {
      let type = 'posts';
      let data: any = {};

      if (typeof arg1 === 'string') {
        type = arg1;
        data = arg2 || {};
      } else {
        data = arg1 || {};
        type = data.type || 'posts';
      }

      const colName = getCollectionName(type, data.type);
      const cleanData = { ...data };
      delete cleanData.id;

      // Upsert protection: If a document with this exact slug already exists, update it instead of making a duplicate
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

      const docRef = await addDoc(collection(db, colName), {
        ...cleanData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return { id: docRef.id, ...cleanData };
    } catch (error) {
      console.error(`contentAPI create error:`, error);
      throw error;
    }
  },

  update: async (arg1: any, arg2?: any, arg3?: any) => {
    try {
      let type = 'knowledge';
      let id = '';
      let data: any = {};

      if (typeof arg1 === 'string' && typeof arg2 === 'string' && arg3) {
        type = arg1;
        id = arg2;
        data = arg3;
      } else if (typeof arg1 === 'string' && arg2) {
        id = arg1;
        data = arg2;
        type = data.type || 'knowledge';
      }

      const colName = getCollectionName(type, data.type);
      const cleanData = { ...data };
      delete cleanData.id;

      const docRef = doc(db, colName, id);
      try {
        await updateDoc(docRef, {
          ...cleanData,
          updated_at: serverTimestamp()
        });
      } catch (err: any) {
        // Fallback: Check alternative collection or setDoc merge
        if (colName === 'knowledge' || colName === 'resources') {
          const altCol = colName === 'knowledge' ? 'resources' : 'knowledge';
          try {
            await updateDoc(doc(db, altCol, id), {
              ...cleanData,
              updated_at: serverTimestamp()
            });
          } catch {
            await setDoc(docRef, {
              ...cleanData,
              updated_at: serverTimestamp()
            }, { merge: true });
          }
        } else {
          await setDoc(docRef, {
            ...cleanData,
            updated_at: serverTimestamp()
          }, { merge: true });
        }
      }

      return { id, ...cleanData };
    } catch (error) {
      console.error(`contentAPI update error:`, error);
      throw error;
    }
  },

  delete: async (arg1: any, arg2?: any) => {
    try {
      let type = 'posts';
      let id = '';

      if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        type = arg1;
        id = arg2;
      } else if (typeof arg1 === 'string') {
        id = arg1;
      }

      const colName = getCollectionName(type);
      try {
        await deleteDoc(doc(db, colName, id));
      } catch (e) {
        console.warn(`[contentAPI.delete] Direct delete on ${colName} failed:`, e);
      }

      if (colName === 'knowledge' || colName === 'resources') {
        const altCol = colName === 'knowledge' ? 'resources' : 'knowledge';
        await deleteDoc(doc(db, altCol, id)).catch(() => {});
      }

      return { success: true };
    } catch (error) {
      console.error(`contentAPI delete error:`, error);
      return { success: true };
    }
  },

  bulkUpdate: async (type: string, ids: string[], fields: Record<string, any>) => {
    try {
      const colName = getCollectionName(type);
      await Promise.all(
        ids.map(id =>
          updateDoc(doc(db, colName, id), { ...fields, updated_at: serverTimestamp() })
        )
      );
      return { success: true };
    } catch (error) {
      console.error(`contentAPI bulkUpdate error:`, error);
      throw error;
    }
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
  get: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'faq_categories', id));
    return { data: docToData(docSnap) };
  },
  create: async (data: any) => {
    const docRef = await addDoc(collection(db, 'faq_categories'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: any) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'faq_categories', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id: string) => {
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
  get: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'guides', id));
    return { data: docToData(docSnap) };
  },
  create: async (data: any) => {
    const docRef = await addDoc(collection(db, 'guides'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: any) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'guides', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id: string) => {
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
  get: async (id: string) => {
    const docSnap = await getDoc(doc(db, 'glossary', id));
    return { data: docToData(docSnap) };
  },
  create: async (data: any) => {
    const docRef = await addDoc(collection(db, 'glossary'), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: any) => {
    const cleanData = { ...data };
    delete cleanData.id;
    await updateDoc(doc(db, 'glossary', id), {
      ...cleanData,
      updated_at: serverTimestamp()
    });
    return { id, ...cleanData };
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'glossary', id));
    return { success: true };
  }
};

export const mediaAPI = {
  list: async (params: any = {}) => {
    try {
      const q = collection(db, 'media');
      
      try {
        let sortedQ: any = q;
        if (!params.noSort) {
          sortedQ = query(q, orderBy('created_at', 'desc'));
        }
        if (params.limit) {
          sortedQ = query(sortedQ, fsLimit(params.limit));
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

  create: async (data: any) => {
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

  delete: async (id: string) => {
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
  },

  optimize: async (source: File | string, options: any = {}) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const body: any = { ...options };
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
  },
  list: async () => {
    try {
      const q = query(collection(db, 'dead_links'), orderBy('hit_count', 'desc'));
      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      console.error('Dead Links List Error:', error);
      return { data: [] };
    }
  },
  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'dead_links', id));
      return { success: true };
    } catch (error) {
      console.error('Dead Link Delete Error:', error);
      throw error;
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
      let rawMerged = [...sortedResults, ...legacyOnly];

      // Deduplicate by slug (keep newest, delete duplicates from Firestore)
      const uniqueMap = new Map<string, any>();
      const duplicatesToDelete: string[] = [];

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
          const getTime = (d: any) => d?.updated_at?.toDate ? d.updated_at.toDate().getTime() : (new Date(d?.updated_at || d?.created_at || 0).getTime());
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

      let merged = Array.from(uniqueMap.values());

      // 1. Search Filter
      if (params.search) {
        const searchTerms = params.search.toLowerCase().split(' ').filter(Boolean);
        merged = merged.filter((p: any) => {
          const searchable = `${p.title || ''} ${p.author_name || ''} ${p.slug || ''}`.toLowerCase();
          return searchTerms.every((term: string) => searchable.includes(term));
        });
      }

      // 2. Sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

      merged.sort((a: any, b: any) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        // Handle specific field types
        if (sortBy === 'created_at' || sortBy === 'createdAt') {
          valA = new Date(a.created_at || a.createdAt || 0).getTime();
          valB = new Date(b.created_at || b.createdAt || 0).getTime();
        } else if (sortBy === 'view_count') {
          valA = Number(valA || 0);
          valB = Number(valB || 0);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
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
  },
  delete: async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        const response = await fetch(`/api/ai/ai-router?target=posts&id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) return { success: true };
        }
      }
    } catch (e) {
      console.warn('Server-side post delete failed, trying client-side...', e);
    }
    await deleteDoc(doc(db, 'posts', id));
    return { success: true };
  },
  bulkUpdate: async (ids: string[], fields: Record<string, any>) => {
    await Promise.all(
      ids.map(id =>
        updateDoc(doc(db, 'posts', id), { ...fields, updated_at: serverTimestamp() })
      )
    );
    return { success: true };
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
  },
  delete: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
      return { success: true };
    } catch (error) {
      console.error('Comment Delete Error:', error);
      throw error;
    }
  },
  update: async (id: string, content: string) => {
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
  report: async (commentId: string, reason: string) => {
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

// --- Admin API ---
export const adminAPI = {
  getStats: async () => {
    try {
      const [postsSnap, profilesSnap, listingsSnap, resourcesSnap, knowledgeSnap, guidesSnap, glossarySnap, faqsSnap, usersSnap, pendingProfilesSnap, pendingListingsSnap, reportsSnap, unreadContactSnap] = await Promise.all([
        getDocs(collection(db, 'posts')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'profiles')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'listings')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'resources')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'knowledge')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'guides')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'glossary')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'faq_categories')).catch(() => ({ size: 0 })),
        getDocs(collection(db, 'users')).catch(() => ({ size: 0 })),
        getDocs(query(collection(db, 'profiles'), where('status', '==', 'pending'))).catch(() => ({ size: 0, docs: [] })),
        getDocs(query(collection(db, 'listings'), where('status', '==', 'pending'))).catch(() => ({ size: 0, docs: [] })),
        getDocs(query(collection(db, 'comment_reports'), where('status', '==', 'pending'))).catch(() => ({ size: 0 })),
        getDocs(query(collection(db, 'contact_messages'), where('status', '==', 'unread'))).catch(() => ({ size: 0, docs: [] }))
      ]);

      const pendingPublicProfiles = (pendingProfilesSnap.docs || []).filter((d: any) => d.data().source === 'public').length;
      const pendingPublicListings = (pendingListingsSnap.docs || []).filter((d: any) => d.data().source === 'public').length;

      const totalResourcesCount = (resourcesSnap.size || 0) + (knowledgeSnap.size || 0) + (guidesSnap.size || 0) + (glossarySnap.size || 0) + (faqsSnap.size || 0);

      return {
        data: {
          total_blog_posts: postsSnap.size || 0,
          total_entrepreneurs: profilesSnap.size || 0,
          total_listings: listingsSnap.size || 0,
          total_resources: totalResourcesCount,
          total_users: usersSnap.size || 0,
          pending_profiles: pendingProfilesSnap.size || 0,
          pending_listings: pendingListingsSnap.size || 0,
          pending_approvals: (pendingProfilesSnap.size || 0) + (pendingListingsSnap.size || 0),
          pending_public_submissions: pendingPublicProfiles + pendingPublicListings,
          pending_reports: reportsSnap.size || 0,
          unread_contact_messages: unreadContactSnap.size || 0
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
      post: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;

    try {
      const subDocRef = doc(db, 'submissions', id);
      const subDocSnap = await getDoc(subDocRef);
      if (subDocSnap.exists()) {
        const subData = subDocSnap.data();
        if (subData.type === 'post' || subData.type === 'article' || subData.title) {
          await addDoc(collection(db, 'posts'), {
            title: subData.title || 'Untitled Post',
            content: subData.content || '',
            excerpt: subData.excerpt || '',
            author_name: subData.author_name || '',
            category: subData.category || '',
            featured_image: subData.featured_image || '',
            status: 'published',
            is_featured: false,
            view_count: 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            slug: (subData.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          });
        }
        await updateDoc(subDocRef, { status: 'published', updated_at: serverTimestamp() });
        return { success: true };
      }
    } catch (e) {
      console.warn('Submission check error, falling back to direct collection update', e);
    }

    await updateDoc(doc(db, colName, id), { status: 'published' });
    return { success: true };
  },
  reject: async (type: string, id: string) => {
    const collectionMap: any = {
      blog: 'posts',
      post: 'posts',
      profile: 'profiles',
      listing: 'listings'
    };
    const colName = collectionMap[type] || type;
    try {
      const subDocRef = doc(db, 'submissions', id);
      const subDocSnap = await getDoc(subDocRef);
      if (subDocSnap.exists()) {
        await updateDoc(subDocRef, { status: 'rejected', updated_at: serverTimestamp() });
        return { success: true };
      }
    } catch (e) {}

    await updateDoc(doc(db, colName, id), { status: 'rejected' });
    return { success: true };
  },
  setStatus: async (type: string, id: string, status: string) => {
    const collectionMap: any = {
      blog: 'posts',
      post: 'posts',
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
      const qPosts = query(collection(db, 'posts'), where('status', '==', 'pending'));
      const qSubmissions = query(collection(db, 'submissions'), where('status', '==', 'pending'));

      const [profilesSnap, listingsSnap, postsSnap, subSnap] = await Promise.all([
        getDocs(qProfiles).catch(() => ({ docs: [] })),
        getDocs(qListings).catch(() => ({ docs: [] })),
        getDocs(qPosts).catch(() => ({ docs: [] })),
        getDocs(qSubmissions).catch(() => ({ docs: [] }))
      ]);

      const directPosts = postsSnap.docs.map(docToData);
      const userSubPosts = subSnap.docs.map(docToData).filter((s: any) => s.type === 'post' || s.type === 'article' || s.title);

      return {
        data: {
          profiles: profilesSnap.docs.map(docToData),
          listings: listingsSnap.docs.map(docToData),
          posts: [...directPosts, ...userSubPosts]
        }
      };
    } catch (error) {
      console.error('Error fetching pending items:', error);
      return { data: { profiles: [], listings: [], posts: [] } };
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
      const [postsSnap, profilesSnap, listingsSnap, resourcesSnap, knowledgeSnap, guidesSnap, glossarySnap, faqsSnap] = await Promise.all([
        getCountFromServer(query(collection(db, 'posts'), where('status', '==', 'published'))).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(query(collection(db, 'profiles'), where('status', '==', 'published'))).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'published'))).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, 'resources')).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, 'knowledge')).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, 'guides')).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, 'glossary')).catch(() => ({ data: () => ({ count: 0 }) })),
        getCountFromServer(collection(db, 'faq_categories')).catch(() => ({ data: () => ({ count: 0 }) }))
      ]);

      const resCount = (resourcesSnap.data ? resourcesSnap.data().count : 0) || 0;
      const knowCount = (knowledgeSnap.data ? knowledgeSnap.data().count : 0) || 0;
      const guideCount = (guidesSnap.data ? guidesSnap.data().count : 0) || 0;
      const glossCount = (glossarySnap.data ? glossarySnap.data().count : 0) || 0;
      const faqCount = (faqsSnap.data ? faqsSnap.data().count : 0) || 0;

      const totalResourcesCount = resCount + knowCount + guideCount + glossCount + faqCount;

      return {
        data: {
          total_blog_posts: (postsSnap.data ? postsSnap.data().count : 0) || 0,
          total_entrepreneurs: (profilesSnap.data ? profilesSnap.data().count : 0) || 0,
          total_listings: (listingsSnap.data ? listingsSnap.data().count : 0) || 0,
          total_resources: totalResourcesCount,
        }
      };
    } catch (error) {
      console.error('Public Stats Error:', error);
      return { data: {} };
    }
  }
};

// --- Contact Messages API ---
export const contactAPI = {
  send: async (data: { name: string; email: string; subject: string; message: string }) => {
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
      return { data: snapshot.docs.map(docToData) };
    } catch (error) {
      const snapshot = await getDocs(collection(db, 'contact_messages'));
      const items = snapshot.docs.map(docToData);
      items.sort((a: any, b: any) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dbTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dbTime - da;
      });
      return { data: items };
    }
  },
  updateStatus: async (id: string, status: string) => {
    await updateDoc(doc(db, 'contact_messages', id), { status });
    return { success: true };
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'contact_messages', id));
    return { success: true };
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
  guidesAPI, faqCategoriesAPI, glossaryAPI, codeSnippetsAPI, redirectAPI, deadLinkAPI, contactAPI,
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



