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
  increment
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Helper to convert Firestore doc to standard object
const docToData = (doc) => {
  if (!doc.exists()) return null;
  return { id: doc.id, ...doc.data() };
};

// --- Blog Posts API ---
export const postAPI = {
  list: async (params = {}) => {
    try {
      let q = collection(db, 'posts');
      
      if (params.category_id && params.category_id !== 'all') {
        q = query(q, where('category_id', '==', parseInt(params.category_id)));
      }
      
      if (params.status && params.status !== 'all') {
        q = query(q, where('status', '==', params.status));
      } else if (!params.isAdmin) {
        q = query(q, where('status', '==', 'published'));
      }

      q = query(q, orderBy('created_at', 'desc'));
      
      if (params.limit) {
        q = query(q, limit(params.limit));
      }

      const snapshot = await getDocs(q);
      return { data: snapshot.docs.map(docToData) };
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
  }
};

// --- Entrepreneurs (Profiles) API ---
export const profileAPI = {
  list: async (params = {}) => {
    try {
      let q = collection(db, 'profiles');
      
      if (params.status && params.status !== 'all') {
        q = query(q, where('status', '==', params.status));
      }
      
      if (params.is_featured) {
        q = query(q, where('is_featured', '==', true));
      }

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter(p => p.name?.toLowerCase().includes(search) || p.company_name?.toLowerCase().includes(search));
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
      return { data: docToData(snapshot.docs[0]) };
    } catch (error) {
      console.error('Firestore Profile Get Error:', error);
      throw error;
    }
  },
  create: async (data) => {
    const res = await addDoc(collection(db, 'profiles'), {
      ...data,
      status: 'pending',
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
      let q = collection(db, 'listings');
      
      if (params.status && params.status !== 'all') {
        q = query(q, where('status', '==', params.status));
      }

      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(docToData);
      
      if (params.search) {
        const search = params.search.toLowerCase();
        data = data.filter(l => l.business_name?.toLowerCase().includes(search));
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
      status: 'pending',
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
    const docSnap = await getDoc(doc(db, colName, id));
    return { data: docToData(docSnap) };
  },
  create: async (payload) => {
    const { type, ...data } = payload;
    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const res = await addDoc(collection(db, colName), {
      ...data,
      created_at: serverTimestamp()
    });
    return { id: res.id, ...data };
  },
  update: async (id, payload) => {
    const { type, ...data } = payload;
    const collectionMap = {
      blog: 'posts',
      entrepreneurs: 'profiles',
      directory: 'listings',
      knowledge: 'resources'
    };
    const colName = collectionMap[type] || type;
    const ref = doc(db, colName, id);
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
    return { id, ...data };
  },
  delete: async (type, id) => {
    const collectionMap = {
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

// --- Interaction API ---
export const interactionAPI = {
  toggleLike: async (type, id) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');
    
    const likeId = `${user.uid}_${id}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeSnap = await getDoc(likeRef);
    const postRef = doc(db, type === 'blog' ? 'posts' : 'listings', id);

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
    const snap = await getDoc(followRef);

    if (snap.exists()) {
      await deleteDoc(followRef);
      return { data: { following: false } };
    } else {
      await setDoc(followRef, { userId: user.uid, profileId, created_at: serverTimestamp() });
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
    // Placeholder returning empty list for now
    return { data: [] };
  },
  create: async (data) => {
    return { data: { id: Date.now(), ...data } };
  },
  delete: async (id) => {
    return { success: true };
  }
};

// --- Admin API ---
export const adminAPI = {
  getStats: async () => {
    try {
      const postsSnap = await getDocs(collection(db, 'posts'));
      const profilesSnap = await getDocs(collection(db, 'profiles'));
      const listingsSnap = await getDocs(collection(db, 'listings'));
      
      const pendingProfiles = query(collection(db, 'profiles'), where('status', '==', 'pending'));
      const pendingSnap = await getDocs(pendingProfiles);

      return {
        data: {
          total_blog_posts: postsSnap.size,
          total_entrepreneurs: profilesSnap.size,
          total_listings: listingsSnap.size,
          pending_approvals: pendingSnap.size
        }
      };
    } catch (error) {
      console.error('Admin Stats Error:', error);
      return { data: { total_blog_posts: 0, total_entrepreneurs: 0, total_listings: 0, pending_approvals: 0 } };
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

export default { 
  postAPI, profileAPI, listingAPI, contentAPI, interactionAPI, 
  adminAPI, commentAPI, resourceAPI, authAPI, categoryAPI, 
  blogCategoryAPI, industryAPI, cityAPI, taxonomyAPI, settingsAPI 
};
