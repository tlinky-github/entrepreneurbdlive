const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('./_lib');
const postGeneratorService = require('../_services/postGeneratorService');
const { encrypt, decrypt } = require('../_services/encryptionService');
const { getFirestore } = require('../_services/firebaseService');
const openaiService = require('../_services/aiProviders/openaiService');
const geminiService = require('../_services/aiProviders/geminiService');
const claudeService = require('../_services/aiProviders/claudeService');

const getProviderService = (provider) => {
  const services = {
    openai: openaiService,
    gemini: geminiService,
    claude: claudeService,
  };
  return services[provider.toLowerCase()];
};

module.exports = async (req, res) => {
  // CORS & Basic Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const db = initializeFirebase();
    const user = await authenticateUser(req);
    const userId = user.uid;
    const { target, action, id: postId } = req.query;

    /**
     * TARGET: STATS
     * Handled from stats.js
     */
    if (target === 'stats') {
      const logsSnapshot = await db.collection('ai_logs').where('userId', '==', userId).get();
      let totalGenerated = 0; let totalPublished = 0; let totalTokens = 0; let totalCost = 0;
      logsSnapshot.forEach((doc) => {
        const log = doc.data();
        totalGenerated++;
        if (log.status === 'published') totalPublished++;
        if (log.tokensUsed) totalTokens += log.tokensUsed;
        if (log.estimatedCost) totalCost += log.estimatedCost;
      });
      return successResponse(res, { totalGenerated, totalPublished, totalTokens, estimatedCost: totalCost.toFixed(4) });
    }

    /**
     * TARGET: GENERATE
     * Handled from generate.js
     */
    if (target === 'generate') {
      const { provider, profileIndex, model, topics, tone, keywords, targetLength, temperature, maxTokens, language, targetDestination, targetStatus, includeSEO, minFaqCount, tokenMode, customPrompt } = req.body;
      if (!provider || !model) return errorResponse(res, 400, 'Provider and model are required');
      const result = await postGeneratorService.generatePost(userId, {
        provider, profileIndex: parseInt(profileIndex) || 0, model, topics: topics || [], tone: tone || 'informative', keywords: keywords || [], targetLength: targetLength || '1000', temperature: parseFloat(temperature) || 0.7, maxTokens: parseInt(maxTokens) || 2000, language: language || 'en', targetDestination: targetDestination || 'blog', targetStatus: targetStatus || 'draft', includeSEO: includeSEO !== false, minFaqCount: parseInt(minFaqCount) || 3, tokenMode: tokenMode || 'auto', customPrompt: customPrompt || null,
      });
      return successResponse(res, { post: result.post });
    }

    /**
     * TARGET: COPILOT
     * Handled from copilot.js
     */
    if (target === 'copilot') {
      const { provider, profileIndex, model, action: copilotAction, text, prompt } = req.body;
      let selProvider = provider; let selModel = model;
      if (!selProvider) {
        const configDoc = await db.collection('ai_configs').doc(userId).get();
        if (configDoc.exists) {
          const provObj = configDoc.data().providers || {};
          for (const [key, p] of Object.entries(provObj)) { if (p.enabled) { selProvider = key; selModel = p.profiles?.[0]?.selectedModel || 'gpt-4-turbo'; break; } }
        }
      }
      if (!selProvider) return errorResponse(res, 400, 'No active AI providers configured');
      const result = await postGeneratorService.copilotAction(userId, { provider: selProvider, profileIndex: parseInt(profileIndex) || 0, model: selModel, action: copilotAction, text, prompt });
      return successResponse(res, result);
    }

    /**
     * TARGET: POSTS
     * Handled from posts-handler.js
     */
    if (target === 'posts') {
      if (req.method === 'GET') {
        if (postId) {
          let postDoc = await db.collection('posts').doc(postId).get();
          if (!postDoc.exists) postDoc = await db.collection('resources').doc(postId).get();
          if (!postDoc.exists) postDoc = await db.collection('ai_posts').doc(postId).get();
          if (!postDoc.exists) return errorResponse(res, 404, 'Post not found');
          if (postDoc.data().userId !== userId) return errorResponse(res, 403, 'Unauthorized');
          return successResponse(res, { id: postDoc.id, ...postDoc.data() });
        } else {
          const { status = 'all', limit = 10, page = 1 } = req.query;
          const limitNum = Math.min(parseInt(limit) || 10, 100);
          const pageNum = Math.max(parseInt(page) || 1, 1);
          const offset = (pageNum - 1) * limitNum;
          let query = db.collection('posts').where('userId', '==', userId).where('is_ai_generated', '==', true);
          if (status && status !== 'all') query = query.where('status', '==', status);
          const totalSnapshot = await query.get();
          const postsSnapshot = await query.orderBy('createdAt', 'desc').limit(limitNum + offset).get();
          const posts = postsSnapshot.docs.slice(offset).map((doc) => ({ id: doc.id, ...doc.data() }));
          return successResponse(res, { posts, total: totalSnapshot.size, pages: Math.ceil(totalSnapshot.size / limitNum), currentPage: pageNum });
        }
      } else if (req.method === 'PUT') {
        if (!postId) return errorResponse(res, 400, 'Post ID required');
        const postRef = db.collection('ai_posts').doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists || postDoc.data().userId !== userId) return errorResponse(res, 404, 'Not found');
        const updates = req.body; updates.updatedAt = new Date();
        await postRef.update(updates);
        return successResponse(res, { id: postId, ...updates });
      } else if (req.method === 'DELETE') {
        if (!postId) return errorResponse(res, 400, 'Post ID required');
        const postRef = db.collection('ai_posts').doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists || postDoc.data().userId !== userId) return errorResponse(res, 404, 'Not found');
        await postRef.delete();
        await db.collection('ai_logs').add({ userId, postId, action: 'delete', status: 'success', timestamp: new Date() });
        return successResponse(res, { success: true, message: 'Post deleted' });
      }
    }

    /**
     * TARGET: PROVIDERS
     * Handled from providers-handler.js
     */
    if (target === 'providers') {
      const dbStore = getFirestore();
      if (req.method === 'GET') {
        if (action === 'config') {
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          const config = configDoc.exists ? configDoc.data() : { providers: {} };
          const sanitized = { providers: {}, settings: config.settings || { minFaqCount: 3 } };
          Object.entries(config.providers || {}).forEach(([p, d]) => {
            sanitized.providers[p] = { enabled: d.enabled, profiles: (d.profiles || []).map(pr => ({ profileName: pr.profileName, selectedModel: pr.selectedModel, createdAt: pr.createdAt })) };
          });
          return successResponse(res, sanitized);
        } else if (action === 'models') {
          const { provider, apiKeyInput } = req.query;
          const service = getProviderService(provider);
          if (!service) return errorResponse(res, 400, 'Unknown provider');
          let apiKey = null;
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          if (configDoc.exists) {
            const pConfig = configDoc.data().providers?.[provider.toLowerCase()];
            if (pConfig?.apiKey) try { apiKey = decrypt(pConfig.apiKey); } catch (e) {}
          }
          if (!apiKey && apiKeyInput) apiKey = apiKeyInput;
          if (!apiKey) return errorResponse(res, 400, 'No API key');
          const models = await service.getAvailableModels(apiKey);
          return successResponse(res, { provider, models });
        }
      } else if (req.method === 'POST') {
        if (action === 'setup') {
          const { provider, apiKey, profileName, selectedModel } = req.body;
          const service = getProviderService(provider);
          await service.testConnection(apiKey);
          const encryptedKey = encrypt(apiKey);
          const models = await service.getAvailableModels(apiKey);
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };
          const pLower = provider.toLowerCase();
          if (!currentConfig.providers[pLower]) currentConfig.providers[pLower] = { enabled: true, profiles: [] };
          const newProfile = { profileName: profileName || 'Default', apiKey: encryptedKey, selectedModel: selectedModel || models[0], createdAt: new Date() };
          currentConfig.providers[pLower].profiles.push(newProfile);
          await dbStore.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse(res, { success: true, profile: newProfile });
        } else if (action === 'settings') {
          const { settings } = req.body;
          if (!settings) return errorResponse(res, 400, 'Settings required');
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };
          currentConfig.settings = { ...(currentConfig.settings || {}), ...settings, updatedAt: new Date() };
          await dbStore.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse(res, { success: true, settings: currentConfig.settings });
        }
      } else if (req.method === 'PUT') {
        if (action === 'update') {
          const { provider, profileIndex, profileName, apiKey, selectedModel } = req.body;
          if (!provider || profileIndex === undefined) return errorResponse(res, 400, 'Invalid parameters');
          const pLower = provider.toLowerCase();
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          if (!configDoc.exists) return errorResponse(res, 404, 'No config');
          const currentConfig = configDoc.data();
          const profiles = currentConfig.providers?.[pLower]?.profiles;
          if (!profiles || !profiles[profileIndex]) return errorResponse(res, 404, 'Profile not found');
          const profile = profiles[profileIndex];
          if (profileName) profile.profileName = profileName;
          if (selectedModel) profile.selectedModel = selectedModel;
          if (apiKey) {
            const service = getProviderService(provider);
            await service.testConnection(apiKey);
            profile.apiKey = encrypt(apiKey);
          }
          profile.updatedAt = new Date();
          profiles[profileIndex] = profile;
          await dbStore.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse(res, { success: true, profile });
        }
      } else if (req.method === 'DELETE') {
        if (action === 'delete') {
          const { provider, profileIndex } = req.body;
          const pLower = provider.toLowerCase();
          const configDoc = await dbStore.collection('ai_configs').doc(userId).get();
          if (!configDoc.exists) return errorResponse(res, 404, 'No config');
          const currentConfig = configDoc.data();
          const profiles = currentConfig.providers?.[pLower]?.profiles;
          if (!profiles || !profiles[profileIndex]) return errorResponse(res, 404, 'Profile not found');
          profiles.splice(profileIndex, 1);
          if (profiles.length === 0) currentConfig.providers[pLower].enabled = false;
          await dbStore.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });
          return successResponse(res, { success: true });
        }
      }
    }

    return errorResponse(res, 400, 'Invalid target or action');
  } catch (error) {
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
