// POST /api/ai/providers/test - Test AI provider connection
const { authenticateUser, errorResponse, successResponse, initializeFirebase } = require('../_lib');
const openaiService = require('../../_services/aiProviders/openaiService');
const geminiService = require('../../_services/aiProviders/geminiService');
const claudeService = require('../../_services/aiProviders/claudeService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'POST') {
      return errorResponse(res, 'Method not allowed', 405);
    }

    await initializeFirebase();
    await authenticateUser(req);

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
      return successResponse(res, {
        success: true,
        provider: provider.toLowerCase(),
        message: 'Provider connection successful',
      });
    } catch (testError) {
      return errorResponse(res, testError.message, 400);
    }
  } catch (error) {
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
