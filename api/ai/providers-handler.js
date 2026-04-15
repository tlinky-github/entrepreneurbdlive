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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
            profiles: (data.profiles || []).map(profile => ({
              profileName: profile.profileName,
              selectedModel: profile.selectedModel,
              createdAt: profile.createdAt,
              updatedAt: profile.updatedAt,
            })),
            // Keep legacy fields for backward compatibility
            models: data.models || [],
            activeModel: data.activeModel,
            configuredAt: data.configuredAt,
          };
        });

        return successResponse(res, sanitizedConfig);
      } else if (action === 'models') {
        // GET: Fetch available models for a provider
        // Can either use saved config (if exists) or accept apiKey in body for setup phase
        const { provider, apiKeyInput } = req.query;

        if (!provider) {
          return errorResponse(res, 400, 'Provider query parameter is required');
        }

        const providerService = getProviderService(provider);
        if (!providerService) {
          return errorResponse(res, 400, 'Unknown provider');
        }

        let apiKey = null;
        
        // Try to get API key from saved config first
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();
        if (configDoc.exists) {
          const config = configDoc.data();
          const providerConfig = config.providers?.[provider.toLowerCase()];
          let apiKey = providerConfig?.apiKey;
          if (apiKey) {
            try {
              apiKey = decrypt(apiKey);
              console.log(`[DEBUG] Decrypted API key for ${provider}. Length: ${apiKey.length}. Starts with: ${apiKey.substring(0, 7)}...`);
              if (apiKey.length < 10) {
                 console.warn(`[DEBUG] API key for ${provider} seems unusually short.`);
              }
            } catch (e) {
              console.error(`[DEBUG] Failed to decrypt API key for ${provider}:`, e.message);
              apiKey = null;
            }
          }
        }

        // If no saved API key, try using the one from query params (for setup phase)
        if (!apiKey && apiKeyInput) {
          apiKey = apiKeyInput;
          console.log(`[DEBUG] Using provided apiKeyInput for ${provider}. Length: ${apiKey.length}`);
        }

        // If still no API key, return error
        if (!apiKey) {
          return errorResponse(res, 400, 'No API key provided or configured. Pass apiKeyInput query parameter or configure provider first.');
        }

        let models = [];
        try {
          models = await providerService.getAvailableModels(apiKey);
        } catch (e) {
          return errorResponse(res, 500, `Failed to fetch models: ${e.message}`);
        }

        if (!models || models.length === 0) {
          return errorResponse(res, 404, `No models found for ${provider}. Check your API key and permissions.`);
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
        // POST: Setup provider with API key and optional profile name
        const { provider, apiKey, profileName, selectedModel } = req.body;

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

        // Store in Firestore with profile support
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();
        const currentConfig = configDoc.exists ? configDoc.data() : { providers: {} };

        currentConfig.providers = currentConfig.providers || {};
        const providerLower = provider.toLowerCase();
        
        // Initialize provider if not exists
        if (!currentConfig.providers[providerLower]) {
          currentConfig.providers[providerLower] = {
            enabled: true,
            profiles: []
          };
        }

        // Create new profile
        const newProfile = {
          profileName: profileName || 'Default',
          apiKey: encryptedKey,
          selectedModel: selectedModel || (models?.[0] || null),
          createdAt: new Date(),
        };

        // Add profile to profiles array
        if (!currentConfig.providers[providerLower].profiles) {
          currentConfig.providers[providerLower].profiles = [];
        }
        currentConfig.providers[providerLower].profiles.push(newProfile);
        currentConfig.providers[providerLower].enabled = true;

        await db.collection('ai_configs').doc(user.uid).set(currentConfig, { merge: true });

        return successResponse(res, {
          success: true,
          provider: providerLower,
          profile: newProfile,
          message: 'Profile configured successfully',
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
    } else if (req.method === 'PUT') {
      if (action === 'update') {
        // PUT: Update an existing profile
        const { provider, profileIndex, profileName, apiKey, selectedModel } = req.body;

        if (!provider || profileIndex === undefined) {
          return errorResponse(res, 400, 'Provider and profileIndex are required');
        }

        const providerLower = provider.toLowerCase();
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();

        if (!configDoc.exists) {
          return errorResponse(res, 404, 'No provider configured');
        }

        const currentConfig = configDoc.data();
        const profiles = currentConfig.providers?.[providerLower]?.profiles;

        if (!profiles || !profiles[profileIndex]) {
          return errorResponse(res, 404, 'Profile not found');
        }

        // Update profile
        const profile = profiles[profileIndex];
        
        if (profileName) profile.profileName = profileName;
        if (selectedModel) profile.selectedModel = selectedModel;
        
        if (apiKey) {
          const providerService = getProviderService(provider);
          try {
            await providerService.testConnection(apiKey);
            profile.apiKey = encrypt(apiKey);
          } catch (testError) {
            return errorResponse(res, 400, `Connection test failed: ${testError.message}`);
          }
        }

        profile.updatedAt = new Date();
        profiles[profileIndex] = profile;

        await db.collection('ai_configs').doc(user.uid).set(currentConfig, { merge: true });

        return successResponse(res, {
          success: true,
          provider: providerLower,
          profile: profile,
          message: 'Profile updated successfully',
        });
      } else {
        return errorResponse(res, 400, 'Invalid action for PUT method');
      }
    } else if (req.method === 'DELETE') {
      if (action === 'delete') {
        // DELETE: Delete a profile
        const { provider, profileIndex } = req.body;

        if (!provider || profileIndex === undefined) {
          return errorResponse(res, 400, 'Provider and profileIndex are required');
        }

        const providerLower = provider.toLowerCase();
        const configDoc = await db.collection('ai_configs').doc(user.uid).get();

        if (!configDoc.exists) {
          return errorResponse(res, 404, 'No provider configured');
        }

        const currentConfig = configDoc.data();
        const profiles = currentConfig.providers?.[providerLower]?.profiles;

        if (!profiles || !profiles[profileIndex]) {
          return errorResponse(res, 404, 'Profile not found');
        }

        // Remove profile
        profiles.splice(profileIndex, 1);
        
        // If no profiles remain, disable provider
        if (profiles.length === 0) {
          currentConfig.providers[providerLower].enabled = false;
        }

        await db.collection('ai_configs').doc(user.uid).set(currentConfig, { merge: true });

        return successResponse(res, {
          success: true,
          provider: providerLower,
          message: 'Profile deleted successfully',
        });
      } else {
        return errorResponse(res, 400, 'Invalid action for DELETE method');
      }
    } else {
      return errorResponse(res, 405, 'Method not allowed');
    }
  } catch (error) {
    const statusCode = error.message.includes('Unauthorized') ? 401 : 500;
    return errorResponse(res, statusCode, error.message);
  }
};
