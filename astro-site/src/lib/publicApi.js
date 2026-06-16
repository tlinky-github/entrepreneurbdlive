/**
 * Public API Client
 * Handles non-authenticated endpoints like public submissions and media
 */

const API_BASE = '/api/public-handler';

const publicAPI = {
  /**
   * Submit an Entrepreneur Profile
   */
  submitEntrepreneur: async (data, turnstileToken) => {
    const response = await fetch(`${API_BASE}?action=submit-entrepreneur`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit-entrepreneur', turnstileToken, data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit profile');
    }
    return await response.json();
  },

  /**
   * Submit a Business Listing
   */
  submitListing: async (data, turnstileToken) => {
    const response = await fetch(`${API_BASE}?action=submit-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit-listing', turnstileToken, data }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit listing');
    }
    return await response.json();
  },

  /**
   * Get a presigned upload URL for guests
   */
  getUploadUrl: async (fileName, contentType, turnstileToken) => {
    const response = await fetch(`${API_BASE}?action=get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'get-upload-url', 
        turnstileToken, 
        fileData: { fileName, contentType } 
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }
    return await response.json();
  },

  /**
   * Optimize an image (e.g. crop/resize) for guests
   */
  optimizeImage: async (params, turnstileToken) => {
    const response = await fetch(`${API_BASE}?action=optimize-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'optimize-image', 
        turnstileToken, 
        imageParams: params 
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to optimize image');
    }
    return await response.json();
  },

  /**
   * List metadata (categories, industries, etc.) for guests
   */
  listMetadata: async (turnstileToken) => {
    const response = await fetch(`${API_BASE}?action=list-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'list-metadata', 
        turnstileToken 
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list metadata');
    }
    return await response.json();
  },

  /**
   * Upload an image directly (bypasses browser CORS)
   */
  uploadDirect: async (file, turnstileToken) => {
    const formData = new FormData();
    formData.append('action', 'upload-direct');
    formData.append('turnstileToken', turnstileToken);
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileType', 'public-submission');

    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return await response.json();
  }
};

export default publicAPI;
