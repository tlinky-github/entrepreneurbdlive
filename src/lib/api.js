import { posts, categories } from '../data/blog-data';

// Backend disabled for static deployment
const API_URL = '';

// Mock API instance since we are running fully static
const api = {
  create: () => api,
  get: (url) => {
    return mockResponse({});
  },
  post: (url, data) => {
    if (url.includes('/upload/presigned-url')) {
      return mockResponse({ mock: true, public_url: '', presigned_url: '' });
    }
    return mockResponse({ success: true, ...data });
  },
  put: (url, data) => {
    return mockResponse({ success: true, ...data });
  },
  delete: (url) => {
    return mockResponse({ success: true });
  },
  interceptors: {
    request: { use: () => { } },
    response: { use: () => { } }
  },
  defaults: { headers: { common: {} } }
};

// Helper to simulate async response
const mockResponse = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Auth API - Mocked
export const authAPI = {
  register: (data) => mockResponse({ user: { id: 1, name: 'Admin', ...data }, token: 'mock-token' }),
  login: (data) => {
    localStorage.setItem('token', 'mock-token');
    return mockResponse({ token: 'mock-token', user: { id: 1, name: 'Admin', role: 'admin' } });
  },
  getMe: () => mockResponse({ id: 1, name: 'Admin', role: 'admin' }),
};

// Category API - Static
export const categoryAPI = {
  list: () => mockResponse(categories),
  create: (data) => {
    return mockResponse({ id: Date.now(), ...data });
  },
  delete: (id) => {
    return mockResponse({ success: true });
  },
};

// Tag API - Mocked
export const tagAPI = {
  list: () => mockResponse([{ id: 1, name: 'business' }, { id: 2, name: 'tech' }]),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
};

// Helper to enrich post with category data
const enrichPost = (post) => {
  if (!post) return null;
  const category = categories.find(c => c.id === post.category_id);
  return {
    ...post,
    category_name: category ? category.name : null,
    category: category // Some components might use the object
  };
};

// Blog Post API - Static
export const postAPI = {
  list: (params) => {
    let filteredPosts = [...posts];

    // Filter by search
    if (params?.search) {
      const q = params.search.toLowerCase();
      filteredPosts = filteredPosts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (params?.category_id && params.category_id !== 'all') {
      filteredPosts = filteredPosts.filter(p => Number(p.category_id) === Number(params.category_id));
    }

    if (params?.limit) {
      filteredPosts = filteredPosts.slice(0, params.limit);
    }

    // Enrich posts
    const enriched = filteredPosts.map(enrichPost);
    return mockResponse(enriched);
  },
  get: (idOrSlug) => {
    const post = posts.find(p => p.id === Number(idOrSlug) || p.slug === idOrSlug);
    if (!post) return Promise.reject({ response: { status: 404 } });
    return mockResponse(enrichPost(post));
  },
  create: (data) => {
    return mockResponse({ id: Date.now(), ...data });
  },
  update: (id, data) => {
    return mockResponse({ id, ...data });
  },
  delete: (id) => {
    return mockResponse({ success: true });
  },
};

// Content API - Mocked
export const contentAPI = {
  list: (type) => mockResponse([]),
  get: (type, id) => mockResponse({}),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
  update: (id, data) => mockResponse({ id, ...data }),
  delete: (id) => mockResponse({ success: true }),
};

// Profile API - Mocked
export const profileAPI = {
  list: (params) => mockResponse([]),
  get: (id) => mockResponse({ id, name: 'Mock Profile' }),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
  update: (id, data) => mockResponse({ id, ...data }),
  delete: (id) => mockResponse({ success: true }),
};

// Directory Listing API - Mocked
export const listingAPI = {
  list: (params) => mockResponse([]),
  get: (id) => mockResponse({ id, name: 'Mock Listing' }),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
  update: (id, data) => mockResponse({ id, ...data }),
  delete: (id) => mockResponse({ success: true }),
};

// Resource API - Mocked
export const resourceAPI = {
  list: (params) => mockResponse([]),
  get: (id) => mockResponse({ id, name: 'Mock Resource' }),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
  update: (id, data) => mockResponse({ id, ...data }),
  delete: (id) => mockResponse({ success: true }),
  trackDownload: (id) => mockResponse({ success: true }),
};

// Comment API - Mocked
export const commentAPI = {
  list: (contentType, contentId, params) => mockResponse([]),
  create: (data) => mockResponse({ id: Date.now(), ...data }),
  delete: (id) => mockResponse({ success: true }),
};

// Like/Bookmark/Follow API - Mocked
export const interactionAPI = {
  toggleLike: (contentType, contentId) => mockResponse({ liked: true }),
  checkLike: (contentType, contentId) => mockResponse({ liked: false }),
  toggleBookmark: (contentType, contentId) => mockResponse({ bookmarked: true }),
  checkBookmark: (contentType, contentId) => mockResponse({ bookmarked: false }),
  toggleFollow: (profileId) => mockResponse({ followed: true }),
  checkFollow: (profileId) => mockResponse({ followed: false }),
};

// Admin API - Mocked
export const adminAPI = {
  getStats: () => mockResponse({ users: 5, posts: posts.length }),
  getUsers: (params) => mockResponse([]),
  updateUserRole: (userId, role) => mockResponse({ success: true }),
  getPending: () => mockResponse({}),
  approve: (contentType, contentId) => mockResponse({ success: true }),
  reject: (contentType, contentId) => mockResponse({ success: true }),
};

// Settings API - Mocked
export const settingsAPI = {
  get: () => mockResponse({ siteName: 'Entrepreneur BD' }),
  update: (data) => mockResponse({ success: true }),
};

export default api;
