import { auth } from './firebase';

/**
 * AI API Client
 * Frontend helper for AI endpoints
 * Makes HTTP requests to backend Express server with Firebase auth
 * 
 * Environment Variables:
 * - REACT_APP_AI_API_BASE: Backend API base URL (default: https://entrepreneurs.bd/api/ai)
 */

// Base API URL - configurable via environment variable
// Production: https://entrepreneurs.bd/api/ai (serverless functions on Vercel)
// Can override with REACT_APP_AI_API_BASE environment variable
const API_BASE = process.env.REACT_APP_AI_API_BASE || 'https://entrepreneurs.bd/api/ai';

// Get Firebase auth token for API requests
const getAuthToken = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
};

// Helper to make authenticated API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

const aiAPI = {
  /**
   * Provider Management
   */

  /**
   * Setup/configure an AI provider with API key and profile name
   */
  setupProvider: async (config) => {
    return apiCall('/providers-handler?action=setup', 'POST', config);
  },

  /**
   * Update an existing provider profile
   */
  updateProfile: async (provider, profileIndex, updates) => {
    return apiCall('/providers-handler?action=update', 'PUT', {
      provider,
      profileIndex,
      ...updates,
    });
  },

  /**
   * Delete a provider profile
   */
  deleteProfile: async (provider, profileIndex) => {
    return apiCall('/providers-handler?action=delete', 'DELETE', {
      provider,
      profileIndex,
    });
  },

  /**
   * Get all configured providers for user
   */
  getProvidersConfig: async () => {
    return apiCall('/providers-handler?action=config', 'GET');
  },

  /**
   * Get available models for a provider
   */
  getProviderModels: async (provider, apiKey = null) => {
    let url = `/providers-handler?action=models&provider=${provider}`;
    if (apiKey) {
      url += `&apiKeyInput=${encodeURIComponent(apiKey)}`;
    }
    return apiCall(url, 'GET');
  },

  /**
   * Test connection to a provider
   */
  testProvider: async (provider, apiKey) => {
    return apiCall('/providers-handler?action=test', 'POST', { provider, apiKey });
  },

  /**
   * Update global AI settings (e.g., FAQ count)
   */
  updateSettings: async (settings) => {
    return apiCall('/providers-handler?action=settings', 'POST', { settings });
  },

  /**
   * Post Generation
   */

  /**
   * Generate a new post
   */
  generatePost: async (config) => {
    return apiCall('/generate', 'POST', config);
  },

  /**
   * Get user's generated posts
   */
  getPosts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.page) params.append('page', filters.page);

    return apiCall(`/posts-handler?${params.toString()}`, 'GET');
  },

  /**
   * Get single post by ID
   */
  getPost: async (postId) => {
    return apiCall(`/posts-handler?id=${postId}`, 'GET');
  },

  /**
   * Update post
   */
  updatePost: async (postId, updates) => {
    return apiCall(`/posts-handler?id=${postId}`, 'PUT', updates);
  },

  /**
   * Delete post
   */
  deletePost: async (postId) => {
    return apiCall(`/posts-handler?id=${postId}`, 'DELETE');
  },

  /**
   * Publish post to platforms
   */
  publishPost: async (postId, targets) => {
    return apiCall(`/posts/${postId}/publish`, 'POST', {
      targets,
    });
  },

  /**
   * Logs & Analytics
   */

  /**
   * Get activity logs
   */
  getLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.type) params.append('type', filters.type);

    return apiCall(`/logs?${params.toString()}`, 'GET');
  },

  /**
   * Get usage statistics
   */
  getStats: async () => {
    return apiCall('/stats', 'GET');
  },
};

export default aiAPI;
