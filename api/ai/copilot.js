// POST /api/ai/copilot - In-editor AI copilot capabilities
const { authenticateUser, errorResponse, successResponse, initializeFirebase } = require('./_lib');
const postGeneratorService = require('../_services/postGeneratorService');

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
      return errorResponse(res, 405, 'Method not allowed');
    }

    await initializeFirebase();
    const user = await authenticateUser(req);

    const { 
      provider, 
      profileIndex, 
      model, 
      action,
      text,
      prompt
    } = req.body;

    let selectedProvider = provider;
    let selectedModel = model;

    if (!selectedProvider) {
      const db = require('../_services/firebaseService').getFirestore();
      const configDoc = await db.collection('ai_configs').doc(user.uid).get();
      if (configDoc.exists) {
         const data = configDoc.data();
         const providersObj = data.providers || {};
         for (const [key, p] of Object.entries(providersObj)) {
            if (p.enabled) {
               selectedProvider = key;
               selectedModel = p.profiles?.[0]?.selectedModel || 'gpt-4-turbo';
               break;
            }
         }
      }
    }

    if (!selectedProvider) {
      return errorResponse(res, 400, 'No active AI providers configured');
    }

    if (!action) {
      return errorResponse(res, 400, 'Copilot action is required');
    }

    // Pass data straight to Copilot orchestration method
    const result = await postGeneratorService.copilotAction(user.uid, {
      provider: selectedProvider,
      profileIndex: parseInt(profileIndex) || 0,
      model: selectedModel,
      action,
      text,
      prompt
    });

    return successResponse(res, result);
  } catch (error) {
    const statusCode = error.message.includes('Unauthorized') ? 401 : 500;
    return errorResponse(res, statusCode, error.message);
  }
};
