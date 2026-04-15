// GET /api/ai/providers/config - Get provider configuration
const { initializeFirebase, authenticateUser, errorResponse, successResponse } = require('../_lib');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user
    const user = await authenticateUser(req);
    const userId = user.uid;

    // Get Firebase instance
    const db = initializeFirebase();

    // Get provider config for user
    const configDoc = await db.collection('ai_configs').doc(userId).get();

    if (!configDoc.exists) {
      return successResponse(res, {
        providers: {
          openai: null,
          gemini: null,
          claude: null,
        },
      });
    }

    const config = configDoc.data();
    
    // Don't send encrypted API keys to frontend, just send provider info
    const sanitizedConfig = {
      providers: {},
    };

    if (config.providers) {
      for (const [provider, data] of Object.entries(config.providers)) {
        if (data) {
          sanitizedConfig.providers[provider] = {
            enabled: data.enabled,
            models: data.models || [],
            activeModel: data.activeModel,
            configuredAt: data.configuredAt,
            // Don't send apiKey
          };
        }
      }
    }

    return successResponse(res, sanitizedConfig);
  } catch (error) {
    console.error('Error fetching provider config:', error);
    return errorResponse(res, error.message.includes('Unauthorized') ? 401 : 500, error.message);
  }
};
