// Consolidated /api/ai/providers handler - handles all provider operations
// Replaces: /api/ai/providers/config.js, /api/ai/providers/setup.js, 
//           /api/ai/providers/models.js, /api/ai/providers/test.js
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('./_lib');
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await initializeFirebase();
    const user = await authenticateUser(req);
    const db = getFirestore();
    const { action } = req.query;

    if (req.method === 'GET') {
      if (action === 'config') {
        // GET: Returns provider configuration
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();
        const config = configDoc.exists ? configDoc.data() : { providers: {} };

        // Sanitize: don't send API keys
        const sanitizedConfig = { providers: {} };
        Object.entries(config.providers || {}).forEach(([provider, data]) => {
          sanitizedConfig.providers[provider] = {
            enabled: data.enabled,
            models: data.models || [],
            activeModel: data.activeModel,
            configuredAt: data.configuredAt,
          };
        });

        return successResponse(res, sanitizedConfig);
      } else if (action === 'models') {
        // GET: Fetch available models for a provider
        const { provider } = req.query;

        if (!provider) {
          return errorResponse(res, 400, 'Provider query parameter is required');
        }

        const providerService = getProviderService(provider);
        if (!providerService) {
          return errorResponse(res, 400, 'Unknown provider');
        }

        const configDoc = await db.collection('ai_configs').doc(user.uid).get();
        if (!configDoc.exists) {
          return errorResponse(res, 404, 'No provider configured');
        }

        const config = configDoc.data();
        const providerConfig = config.providers?.[provider.toLowerCase()];

        if (!providerConfig) {
          return errorResponse(res, 404, `Provider ${provider} not configured`);
        }

        let apiKey;
        try {
          apiKey = decrypt(providerConfig.apiKey);
        } catch (e) {
          return errorResponse(res, 500, 'Failed to decrypt API key');
        }

        let models = [];
        try {
          models = await providerService.getAvailableModels(apiKey);
        } catch (e) {
          return errorResponse(res, 500, `Failed to fetch models: ${e.message}`);
        }

        return successResponse(res, {
          provider: provider.toLowerCase(),
          models: models || [],
        });
      } else {
        return errorResponse(res, 400, 'Invalid action. Use ?action=config or ?action=models');
      }
    } else if (req.method === 'POST') {
      if (action === 'setup') {
        // POST: Setup provider with API key
        const { provider, apiKey } = req.body;

        if (!provider || !apiKey) {
          return errorResponse(res, 400, 'Provider and API key are required');
        }

        const providerService = getProviderService(provider);
        if (!providerService) {
          return errorResponse(res, 400, 'Unknown provider');
        }

        // Test connection
        try {
          await providerService.testConnection(apiKey);
        } catch (testError) {
          return errorResponse(res, 400, `Connection test failed: ${testError.message}`);
        }

        // Encrypt API key
        const encryptedKey = encrypt(apiKey);

        // Get available models
        let models = [];
        try {
          models = await providerService.getAvailableModels(apiKey);
        } catch (e) {
          console.warn('Failed to fetch models:', e.message);
        }

        // Store in Firestore
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();
        const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };

        currentConfig.providers = currentConfig.providers || {};
        currentConfig.providers[provider.toLowerCase()] = {
          enabled: true,
          apiKey: encryptedKey,
          models: models || [],
          activeModel: models?.[0] || null,
          configuredAt: new Date(),
        };

        await db.collection('ai_configs').doc(user.uid).set(currentConfig, { merge: true });

        return successResponse(res, {
          provider: provider.toLowerCase(),
          enabled: true,
          models: models || [],
          activeModel: models?.[0] || null,
          message: 'Provider configured successfully',
        });
      } else if (action === 'test') {
        // POST: Test provider connection without storing
        const { provider, apiKey } = req.body;

        if (!provider || !apiKey) {
          return errorResponse(res, 400, 'Provider and API key are required');
        }

        const providerService = getProviderService(provider);
        if (!providerService) {
          return errorResponse(res, 400, 'Unknown provider');
        }

        try {
          await providerService.testConnection(apiKey);
          return successResponse(res, {
            success: true,
            provider: provider.toLowerCase(),
            message: 'Provider connection successful',
          });
        } catch (testError) {
          return errorResponse(res, 400, testError.message);
        }
      } else {
        return errorResponse(res, 400, 'Invalid action. Use ?action=setup or ?action=test');
      }
    } else {
      return errorResponse(res, 405, 'Method not allowed');
    }
  } catch (error) {
    const statusCode = error.message.includes('Unauthorized') ? 401 : 500;
    return errorResponse(res, statusCode, error.message);
  }
};
