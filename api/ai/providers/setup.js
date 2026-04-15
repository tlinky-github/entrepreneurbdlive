// POST /api/ai/providers/setup - Setup AI provider
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('../_lib');
const { encrypt } = require('../../_services/encryptionService');
const { getFirestore } = require('../../_services/firebaseService');
const openaiService = require('../../_services/aiProviders/openaiService');
const geminiService = require('../../_services/aiProviders/geminiService');
const claudeService = require('../../_services/aiProviders/claudeService');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'POST') {
      return errorResponse(res, 'Method not allowed', 405);
    }

    await initializeFirebase();
    const user = await authenticateUser(req);

    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return errorResponse(res, 'Provider and API key are required', 400);
    }

    // Get provider service
    const providerServices = {
      openai: openaiService,
      gemini: geminiService,
      claude: claudeService,
    };

    const providerService = providerServices[provider.toLowerCase()];
    if (!providerService) {
      return errorResponse(res, 'Unknown provider', 400);
    }

    // Test connection
    try {
      await providerService.testConnection(apiKey);
    } catch (testError) {
      return errorResponse(res, `Connection test failed: ${testError.message}`, 400);
    }

    // Encrypt API key
    const encryptedKey = encrypt(apiKey);

    // Get available models
    let models = [];
    try {
      models = await providerService.getAvailableModels(apiKey);
    } catch (e) {
      // Continue with empty models if fetching fails
      console.warn('Failed to fetch models:', e.message);
    }

    // Store in Firestore
    const db = getFirestore();
    const userId = user.uid;

    const configDoc = await db.collection('ai_configs').doc(userId).get();
    const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };

    // Update provider config
    currentConfig.providers = currentConfig.providers || {};
    currentConfig.providers[provider.toLowerCase()] = {
      enabled: true,
      apiKey: encryptedKey,
      models: models || [],
      activeModel: models?.[0] || null,
      configuredAt: new Date(),
    };

    await db.collection('ai_configs').doc(userId).set(currentConfig, { merge: true });

    return successResponse(res, {
      provider: provider.toLowerCase(),
      enabled: true,
      models: models || [],
      activeModel: models?.[0] || null,
      message: 'Provider configured successfully',
    });
  } catch (error) {
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
