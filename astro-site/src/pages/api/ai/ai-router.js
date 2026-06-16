import { getFirestore, verifyFirebaseIdToken } from '../../../lib/firebaseAdmin.js';
import postGeneratorService from '../../../lib/services/postGeneratorService.js';
import { encrypt, decrypt } from '../../../lib/services/encryptionService.js';
import openaiService from '../../../lib/services/aiProviders/openaiService.js';
import geminiService from '../../../lib/services/aiProviders/geminiService.js';
import claudeService from '../../../lib/services/aiProviders/claudeService.js';

const getProviderService = (provider) => {
  const services = {
    openai: openaiService,
    gemini: geminiService,
    claude: claudeService,
  };
  return services[provider.toLowerCase()];
};

export const ALL = async ({ request, url }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const errorResponse = (statusCode, message) => {
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), { status: statusCode, headers: corsHeaders });
  };

  const successResponse = (data, message = '') => {
    const responseData = typeof data === 'object' && data !== null && !Array.isArray(data) 
      ? { success: true, ...data, message }
      : { success: true, data, message };

    return new Response(JSON.stringify(responseData), { status: 200, headers: corsHeaders });
  };

  try {
    const db = getFirestore();
    
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(401, 'Unauthorized: No token provided');
    }
    const idToken = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      return errorResponse(401, `Unauthorized: ${error.message}`);
    }

    const userId = decodedToken.uid;
    const target = url.searchParams.get('target');
    const action = url.searchParams.get('action');
    const postId = url.searchParams.get('id');

    let body = {};
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      try {
        body = await request.json();
      } catch (e) {
        // Body may not be present or not JSON
      }
    }

    /**
     * TARGET: STATS
     */
    if (target === 'stats') {
      const logsSnapshot = await db.collection('ai_logs').where('userId', '==', userId).get();
      let totalGenerated = 0; 
      let totalPublished = 0; 
      let totalTokens = 0; 
      let totalCost = 0;

      logsSnapshot.forEach((doc) => {
        const log = doc.data();
        totalGenerated++;
        if (log.status === 'published') totalPublished++;
        if (log.tokensUsed) totalTokens += log.tokensUsed;
        if (log.estimatedCost) totalCost += log.estimatedCost;
      });

      return successResponse({ 
        totalGenerated, 
        totalPublished, 
        totalTokens, 
        estimatedCost: totalCost.toFixed(4) 
      });
    }

    /**
     * TARGET: GENERATE
     */
    if (target === 'generate') {
      const { 
        provider, 
        profileIndex, 
        model, 
        topics, 
        tone, 
        keywords, 
        targetLength, 
        temperature, 
        maxTokens, 
        language, 
        targetDestination, 
        targetStatus, 
        includeSEO, 
        minFaqCount, 
        tokenMode, 
        customPrompt 
      } = body;

      if (!provider || !model) return errorResponse(400, 'Provider and model are required');
      
      const result = await postGeneratorService.generatePost(userId, {
        provider, 
        profileIndex: parseInt(profileIndex) || 0, 
        model, 
        topics: topics || [], 
        tone: tone || 'informative', 
        keywords: keywords || [], 
        targetLength: targetLength || '1000', 
        temperature: parseFloat(temperature) || 0.7, 
        maxTokens: parseInt(maxTokens) || 2000, 
        language: language || 'en', 
        targetDestination: targetDestination || 'blog', 
        targetStatus: targetStatus || 'draft', 
        includeSEO: includeSEO !== false, 
        minFaqCount: parseInt(minFaqCount) || 3, 
        tokenMode: tokenMode || 'auto', 
        customPrompt: customPrompt || null,
      });

      return successResponse({ post: result.post });
    }

    /**
     * TARGET: COPILOT
     */
    if (target === 'copilot') {
      const { provider, profileIndex, model, action: copilotAction, text, prompt } = body;
      let selProvider = provider; 
      let selModel = model;

      if (!selProvider) {
        const configDoc = await db.collection('ai_configs').doc(userId).get();
        if (configDoc.exists) {
          const provObj = configDoc.data().providers || {};
          for (const [key, p] of Object.entries(provObj)) { 
            if (p.enabled) { 
              selProvider = key; 
              selModel = p.profiles?.[0]?.selectedModel || 'gpt-4-turbo'; 
              break; 
            } 
          }
        }
      }

      if (!selProvider) return errorResponse(400, 'No active AI providers configured');
      
      const result = await postGeneratorService.copilotAction(userId, { 
        provider: selProvider, 
        profileIndex: parseInt(profileIndex) || 0, 
        model: selModel, 
        action: copilotAction, 
        text, 
        prompt 
      });

      return successResponse(result);
    }

    /**
     * TARGET: POSTS
     */
    if (target === 'posts') {
      if (request.method === 'GET') {
        if (postId) {
          let postDoc = await db.collection('posts').doc(postId).get();
          if (!postDoc.exists) postDoc = await db.collection('resources').doc(postId).get();
          if (!postDoc.exists) postDoc = await db.collection('ai_posts').doc(postId).get();
          if (!postDoc.exists) return errorResponse(404, 'Post not found');
          if (postDoc.data().userId !== userId) return errorResponse(403, 'Unauthorized');
          return successResponse({ id: postDoc.id, ...postDoc.data() });
        } else {
          const status = url.searchParams.get('status') || 'all';
          const limit = url.searchParams.get('limit') || 10;
          const page = url.searchParams.get('page') || 1;

          const limitNum = Math.min(parseInt(limit) || 10, 100);
          const pageNum = Math.max(parseInt(page) || 1, 1);
          const offset = (pageNum - 1) * limitNum;

          let query = db.collection('posts').where('userId', '==', userId).where('is_ai_generated', '==', true);
          if (status && status !== 'all') query = query.where('status', '==', status);

          const totalSnapshot = await query.get();
          const postsSnapshot = await query.orderBy('createdAt', 'desc').limit(limitNum + offset).get();
          const posts = postsSnapshot.docs.slice(offset).map((doc) => ({ id: doc.id, ...doc.data() }));

          return successResponse({ 
            posts, 
            total: totalSnapshot.size, 
            pages: Math.ceil(totalSnapshot.size / limitNum), 
            currentPage: pageNum 
          });
        }
      } else if (request.method === 'PUT') {
        if (!postId) return errorResponse(400, 'Post ID required');
        const postRef = db.collection('ai_posts').doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists || postDoc.data().userId !== userId) return errorResponse(404, 'Not found');
        
        const updates = body; 
        updates.updatedAt = new Date();
        await postRef.update(updates);
        return successResponse({ id: postId, ...updates });
      } else if (request.method === 'DELETE') {
        if (!postId) return errorResponse(400, 'Post ID required');

        // Check if user is admin or editor
        let isUserAdmin = false;
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const role = userDoc.data().role;
          isUserAdmin = role === 'super_admin' || role === 'editor';
        }

        const canDelete = (docData) => {
          return isUserAdmin || docData.userId === userId || docData.authorId === userId;
        };

        let found = false;

        // 1. Check & delete from posts
        const postRef = db.collection('posts').doc(postId);
        const postDoc = await postRef.get();
        if (postDoc.exists) {
          if (canDelete(postDoc.data())) {
            await postRef.delete();
            found = true;
          } else {
            return errorResponse(403, 'Unauthorized to delete this post');
          }
        }

        // 2. Check & delete from resources
        const resourceRef = db.collection('resources').doc(postId);
        const resourceDoc = await resourceRef.get();
        if (resourceDoc.exists) {
          if (canDelete(resourceDoc.data())) {
            await resourceRef.delete();
            found = true;
          } else {
            return errorResponse(403, 'Unauthorized to delete this resource');
          }
        }

        // 3. Check & delete from profiles
        const profileRef = db.collection('profiles').doc(postId);
        const profileDoc = await profileRef.get();
        if (profileDoc.exists) {
          if (canDelete(profileDoc.data())) {
            await profileRef.delete();
            found = true;
          } else {
            return errorResponse(403, 'Unauthorized to delete this profile');
          }
        }

        // 4. Check & delete from listings
        const listingRef = db.collection('listings').doc(postId);
        const listingDoc = await listingRef.get();
        if (listingDoc.exists) {
          if (canDelete(listingDoc.data())) {
            await listingRef.delete();
            found = true;
          } else {
            return errorResponse(403, 'Unauthorized to delete this listing');
          }
        }

        // 5. Check & delete from ai_posts
        const aiPostRef = db.collection('ai_posts').doc(postId);
        const aiPostDoc = await aiPostRef.get();
        if (aiPostDoc.exists) {
          if (canDelete(aiPostDoc.data())) {
            await aiPostRef.delete();
            found = true;
          } else {
            return errorResponse(403, 'Unauthorized to delete this AI post');
          }
        }

        if (!found) {
          return errorResponse(404, 'Post or item not found');
        }

        await db.collection('ai_logs').add({ 
          userId, 
          postId, 
          action: 'delete', 
          status: 'success', 
          timestamp: new Date() 
        });
        return successResponse({ success: true, message: 'Item deleted successfully' });
      }
    }

    /**
     * TARGET: PROVIDERS
     */
    if (target === 'providers') {
      if (request.method === 'GET') {
        if (action === 'config') {
          const configDoc = await db.collection('ai_configs').doc(userId).get();
          const config = configDoc.exists ? configDoc.data() : { providers: {} };
          const sanitized = { providers: {}, settings: config.settings || { minFaqCount: 3 } };

          Object.entries(config.providers || {}).forEach(([p, d]) => {
            sanitized.providers[p] = { 
              enabled: d.enabled, 
              profiles: (d.profiles || []).map(pr => ({ 
                profileName: pr.profileName, 
                selectedModel: pr.selectedModel, 
                createdAt: pr.createdAt 
              })) 
            };
          });

          return successResponse(sanitized);
        } else if (action === 'models') {
          const provider = url.searchParams.get('provider');
          const apiKeyInput = url.searchParams.get('apiKeyInput')?.trim();

          const service = getProviderService(provider);
          if (!service) return errorResponse(400, 'Unknown provider');

          let apiKey = null;
          const configDoc = await db.collection('ai_configs').doc(userId).get();
          if (configDoc.exists) {
            const pConfig = configDoc.data().providers?.[provider.toLowerCase()];
            if (pConfig?.apiKey) {
              try { 
                apiKey = decrypt(pConfig.apiKey)?.trim(); 
              } catch (e) {
                console.error('Failed to decrypt API key:', e.message);
              }
            }
          }

          if (!apiKey && apiKeyInput) apiKey = apiKeyInput;
          if (!apiKey) return errorResponse(400, 'No API key configured or provided');

          const models = await service.getAvailableModels(apiKey);
          return successResponse({ provider, models });
        }
      } else if (request.method === 'POST') {
        if (action === 'setup') {
          let { provider, apiKey, profileName, selectedModel } = body;
          apiKey = apiKey?.trim();
          const service = getProviderService(provider);
          if (!service) return errorResponse(400, 'Unknown provider');

          await service.testConnection(apiKey);
          const encryptedKey = encrypt(apiKey);
          const models = await service.getAvailableModels(apiKey);

          const configDoc = await db.collection('ai_configs').doc(userId).get();
          const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };
          const pLower = provider.toLowerCase();

          if (!currentConfig.providers) currentConfig.providers = {};
          if (!currentConfig.providers[pLower]) {
            currentConfig.providers[pLower] = { enabled: true, profiles: [] };
          }

          const newProfile = { 
            profileName: profileName || 'Default', 
            apiKey: encryptedKey, 
            selectedModel: selectedModel || models[0], 
            createdAt: new Date() 
          };
          currentConfig.providers[pLower].profiles.push(newProfile);

          await db.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse({ success: true, profile: newProfile });
        } else if (action === 'settings') {
          const { settings } = body;
          if (!settings) return errorResponse(400, 'Settings required');

          const configDoc = await db.collection('ai_configs').doc(userId).get();
          const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };

          currentConfig.settings = { 
            ...(currentConfig.settings || {}), 
            ...settings, 
            updatedAt: new Date() 
          };

          await db.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse({ success: true, settings: currentConfig.settings });
        }
      } else if (request.method === 'PUT') {
        if (action === 'update') {
          let { provider, profileIndex, profileName, apiKey, selectedModel } = body;
          apiKey = apiKey?.trim();
          if (!provider || profileIndex === undefined) return errorResponse(400, 'Invalid parameters');

          const pLower = provider.toLowerCase();
          const configDoc = await db.collection('ai_configs').doc(userId).get();
          if (!configDoc.exists) return errorResponse(404, 'No config');

          const currentConfig = configDoc.data();
          const profiles = currentConfig.providers?.[pLower]?.profiles;
          if (!profiles || !profiles[profileIndex]) return errorResponse(404, 'Profile not found');

          const profile = profiles[profileIndex];
          if (profileName) profile.profileName = profileName;
          if (selectedModel) profile.selectedModel = selectedModel;

          if (apiKey) {
            const service = getProviderService(provider);
            if (!service) return errorResponse(400, 'Unknown provider');

            await service.testConnection(apiKey);
            profile.apiKey = encrypt(apiKey);
          }

          profile.updatedAt = new Date();
          profiles[profileIndex] = profile;

          await db.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse({ success: true, profile });
        }
      } else if (request.method === 'DELETE') {
        if (action === 'delete') {
          const provider = body.provider || url.searchParams.get('provider');
          const profileIndexStr = body.profileIndex !== undefined ? body.profileIndex : url.searchParams.get('profileIndex');
          
          if (!provider || profileIndexStr === undefined || profileIndexStr === null) {
            return errorResponse(400, 'Invalid parameters');
          }

          const profileIndex = parseInt(profileIndexStr);
          const pLower = provider.toLowerCase();
          const configDoc = await db.collection('ai_configs').doc(userId).get();
          if (!configDoc.exists) return errorResponse(404, 'No config');

          const currentConfig = configDoc.data();
          const profiles = currentConfig.providers?.[pLower]?.profiles;
          if (!profiles || !profiles[profileIndex]) return errorResponse(404, 'Profile not found');

          profiles.splice(profileIndex, 1);
          if (profiles.length === 0) {
            currentConfig.providers[pLower].enabled = false;
          }

          await db.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse({ success: true });
        }
      }
    }

    return errorResponse(400, 'Invalid target or action');
  } catch (error) {
    console.error('API execution error:', error);
    return errorResponse(
      error.message.includes('Unauthorized') ? 401 : 500, 
      error.message
    );
  }
};
