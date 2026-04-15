// POST /api/ai/generate - Generate AI post
const { authenticateUser, errorResponse, successResponse, initializeFirebase } = require('../_lib');
const postGeneratorService = require('../../_services/postGeneratorService');

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
    const user = await authenticateUser(req);

    const { provider, model, topics, tone, keywords, temperature, maxTokens, language } = req.body;

    if (!provider || !model) {
      return errorResponse(res, 'Provider and model are required', 400);
    }

    // Generate post using orchestration service
    const result = await postGeneratorService.generatePost(user.uid, {
      provider,
      model,
      topics: topics || [],
      tone: tone || 'informative',
      keywords: keywords || [],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1500,
      language: language || 'en',
    });

    return successResponse(res, result.post);
  } catch (error) {
    const statusCode = error.message.includes('Unauthorized') ? 401 : 500;
    return errorResponse(res, error.message, statusCode);
  }
};
