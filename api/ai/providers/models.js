// GET /api/ai/providers/models - Get available models for provider
const { authenticateUser, errorResponse, successResponse, initializeFirebase } = require('../_lib');
const { getFirestore } = require('../../_services/firebaseService');
const { decrypt } = require('../../_services/encryptionService');
const openaiService = require('../../_services/aiProviders/openaiService');
const geminiService = require('../../_services/aiProviders/geminiService');
const claudeService = require('../../_services/aiProviders/claudeService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'GET') {
      return errorResponse(res, 'Method not allowed', 405);
    }

    await initializeFirebase();
    const user = await authenticateUser(req);

    const { provider } = req.query;

    if (!provider) {
      return errorResponse(res, 'Provider query parameter is required', 400);
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

    // Get user's API key from config
    const db = getFirestore();
    const configDoc = await db.collection('ai_configs').doc(user.uid).get();

    if (!configDoc.exists) {
      return errorResponse(res, 'No provider configured', 404);
    }

    const config = configDoc.data();
    const providerConfig = config.providers?.[provider.toLowerCase()];

    if (!providerConfig) {
      return errorResponse(res, `Provider ${provider} not configured`, 404);
    }

    // Decrypt API key
    let apiKey;
    try {
      apiKey = decrypt(providerConfig.apiKey);
    } catch (e) {
      return errorResponse(res, 'Failed to decrypt API key', 500);
    }

    // Fetch models from provider
    let models = [];
    try {
      models = await providerService.getAvailableModels(apiKey);
    } catch (e) {
      return errorResponse(res, `Failed to fetch models: ${e.message}`, 500);
    }

    return successResponse(res, {
      provider: provider.toLowerCase(),
      models: models || [],
    });
  } catch (error) {
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
