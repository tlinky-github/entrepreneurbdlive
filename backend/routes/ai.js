const express = require('express');
const router = express.Router();
const { verifyToken, getFirestore } = require('../services/firebaseService');
const { encrypt, decrypt, maskSecret } = require('../services/encryptionService');
const postGeneratorService = require('../services/postGeneratorService');
const openaiService = require('../services/aiProviders/openaiService');
const geminiService = require('../services/aiProviders/geminiService');
const claudeService = require('../services/aiProviders/claudeService');

/**
 * Middleware to verify Firebase token
 */
async function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decodedToken = await verifyToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * Provider Management Routes
 */

/**
 * POST /api/ai/providers/setup
 * Setup or update AI provider API key
 */
router.post('/providers/setup', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    const userId = req.user.uid;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and API key are required' });
    }

    // Validate provider
    const validProviders = ['openai', 'gemini', 'claude'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({ error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` });
    }

    console.log(`[API] Setting up ${provider} for user ${userId}`);

    // Get provider service
    const providerMap = {
      openai: openaiService,
      gemini: geminiService,
      claude: claudeService,
    };
    const providerService = providerMap[provider.toLowerCase()];

    // Test connection with provided key
    const testResult = await providerService.testConnection(apiKey);

    if (!testResult.success) {
      return res.status(400).json({
        error: 'API key validation failed',
        message: testResult.message,
      });
    }

    // Encrypt API key
    const encryptedKey = encrypt(apiKey);

    // Get or create AI config for user
    const db = getFirestore();
    const configRef = db.collection('ai_configs').doc(userId);
    const configDoc = await configRef.get();

    const providerName = provider.toLowerCase();
    let updatedConfig;

    if (configDoc.exists) {
      const currentConfig = configDoc.data();
      updatedConfig = {
        ...currentConfig,
        providers: {
          ...currentConfig.providers,
          [providerName]: {
            apiKey: encryptedKey,
            enabled: true,
            models: testResult.models,
            activeModel: testResult.models[0],
            configuredAt: new Date(),
          },
        },
        updatedAt: new Date(),
      };
    } else {
      updatedConfig = {
        providers: {
          [providerName]: {
            apiKey: encryptedKey,
            enabled: true,
            models: testResult.models,
            activeModel: testResult.models[0],
            configuredAt: new Date(),
          },
        },
        defaultProvider: providerName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    await configRef.set(updatedConfig, { merge: true });

    // Log event
    await db.collection('ai_logs').add({
      userId,
      action: 'provider_setup',
      status: 'success',
      provider: providerName,
      message: `${provider} configured`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `${provider} configured successfully`,
      provider: providerName,
      models: testResult.models,
      apiKeyPreview: maskSecret(apiKey),
    });
  } catch (error) {
    console.error('Provider setup error:', error);
    res.status(500).json({
      error: 'Failed to setup provider',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/providers/config
 * Get all configured providers for current user
 */
router.get('/providers/config', async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = getFirestore();
    const configDoc = await db.collection('ai_configs').doc(userId).get();

    if (!configDoc.exists) {
      return res.json({
        providers: {},
        message: 'No AI providers configured yet',
      });
    }

    const config = configDoc.data();
    const sanitizedConfig = {
      providers: {},
      defaultProvider: config.defaultProvider,
      updatedAt: config.updatedAt,
    };

    // Don't return encrypted keys, just status info
    for (const [name, providerConfig] of Object.entries(config.providers || {})) {
      sanitizedConfig.providers[name] = {
        enabled: providerConfig.enabled,
        models: providerConfig.models,
        activeModel: providerConfig.activeModel,
        configuredAt: providerConfig.configuredAt,
      };
    }

    res.json(sanitizedConfig);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      error: 'Failed to get provider configuration',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/providers/models
 * Get available models for a provider
 */
router.get('/providers/models', async (req, res) => {
  try {
    const { provider } = req.query;

    if (!provider) {
      return res.status(400).json({ error: 'Provider query parameter is required' });
    }

    const userId = req.user.uid;
    const db = getFirestore();
    const configDoc = await db.collection('ai_configs').doc(userId).get();

    if (!configDoc.exists || !configDoc.data().providers[provider]) {
      return res.status(400).json({ error: `${provider} not configured` });
    }

    const models = configDoc.data().providers[provider].models || [];

    res.json({
      provider,
      models,
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      error: 'Failed to get models',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai/providers/test
 * Test connection to a provider
 */
router.post('/providers/test', async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.user.uid;

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    const db = getFirestore();
    const configDoc = await db.collection('ai_configs').doc(userId).get();

    if (!configDoc.exists || !configDoc.data().providers[provider]) {
      return res.status(400).json({ error: `${provider} not configured for this user` });
    }

    const apiKey = decrypt(configDoc.data().providers[provider].apiKey);
    const providerMap = {
      openai: openaiService,
      gemini: geminiService,
      claude: claudeService,
    };

    const providerService = providerMap[provider];
    const testResult = await providerService.testConnection(apiKey);

    res.json(testResult);
  } catch (error) {
    console.error('Provider test error:', error);
    res.status(500).json({
      error: 'Failed to test provider',
      message: error.message,
    });
  }
});

/**
 * Post Generation Routes
 */

/**
 * POST /api/ai/generate
 * Generate a new post
 */
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user.uid;
    const config = req.body;

    console.log(`[API] Generating post for user ${userId}`);

    const post = await postGeneratorService.generatePost(userId, config);

    res.json({
      success: true,
      postId: post.id || post.postId,
      post,
      message: 'Post generated successfully',
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(400).json({
      error: 'Failed to generate post',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/posts
 * Get user's generated posts
 */
router.get('/posts', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { status, limit = 20, page = 1 } = req.query;

    const result = await postGeneratorService.getPosts(userId, {
      status,
      limit: parseInt(limit),
      page: parseInt(page),
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({
      error: 'Failed to get posts',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/posts/:postId
 * Get single post by ID
 */
router.get('/posts/:postId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;

    const post = await postGeneratorService.getPost(userId, postId);

    res.json(post);
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(404).json({
      error: 'Failed to get post',
      message: error.message,
    });
  }
});

/**
 * PUT /api/ai/posts/:postId
 * Update post
 */
router.put('/posts/:postId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;
    const updates = req.body;

    const post = await postGeneratorService.updatePost(userId, postId, updates);

    res.json({
      success: true,
      post,
      message: 'Post updated successfully',
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(400).json({
      error: 'Failed to update post',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/ai/posts/:postId
 * Delete post
 */
router.delete('/posts/:postId', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;

    await postGeneratorService.deletePost(userId, postId);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(400).json({
      error: 'Failed to delete post',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/logs
 * Get user's activity logs
 */
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50, type } = req.query;
    const db = getFirestore();

    let query = db.collection('ai_logs').where('userId', '==', userId);

    if (type) {
      query = query.where('action', '==', type);
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      error: 'Failed to get logs',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/stats
 * Get user's AI usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = getFirestore();

    // Get counts
    const postsSnapshot = await db.collection('ai_posts')
      .where('userId', '==', userId)
      .count()
      .get();

    const publishedSnapshot = await db.collection('ai_posts')
      .where('userId', '==', userId)
      .where('status', '==', 'published')
      .count()
      .get();

    const logsSnapshot = await db.collection('ai_logs')
      .where('userId', '==', userId)
      .where('action', '==', 'generation')
      .get();

    // Calculate stats
    let totalTokens = 0;
    logsSnapshot.forEach(doc => {
      totalTokens += doc.data().metrics?.tokenUsed || 0;
    });

    // Rough estimation: $0.002 per 1000 tokens for GPT-3.5
    const estimatedCost = (totalTokens / 1000) * 0.002;

    res.json({
      totalGenerated: postsSnapshot.data().count,
      totalPublished: publishedSnapshot.data().count,
      tokensUsedTotal: totalTokens,
      estimatedCostUSD: estimatedCost.toFixed(2),
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

module.exports = router;
