// POST /api/ai/generate - Generate AI post
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

    const { provider, profileIndex, model, topics, tone, keywords, temperature, maxTokens, language } = req.body;

    if (!provider || !model) {
      return errorResponse(res, 400, 'Provider and model are required');
    }

    // Generate post using orchestration service
    const result = await postGeneratorService.generatePost(user.uid, {
      provider,
      profileIndex: parseInt(profileIndex) || 0,
      model,
      topics: topics || [],
      tone: tone || 'informative',
      keywords: keywords || [],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1500,
      language: language || 'en',
    });

    return successResponse(res, { post: result.post });
  } catch (error) {
    const statusCode = error.message.includes('Unauthorized') ? 401 : 500;
    return errorResponse(res, statusCode, error.message);
  }
};
