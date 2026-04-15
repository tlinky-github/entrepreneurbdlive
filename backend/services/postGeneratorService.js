const { getFirestore } = require('./firebaseService');
const { encrypt, decrypt } = require('./encryptionService');
const openaiService = require('./aiProviders/openaiService');
const geminiService = require('./aiProviders/geminiService');
const claudeService = require('./aiProviders/claudeService');

/**
 * Post Generator Service
 * Orchestrates content generation from various AI providers
 */

const PROVIDERS = {
  openai: openaiService,
  gemini: geminiService,
  claude: claudeService,
};

/**
 * Get AI provider service by name
 * @param {string} providerName - 'openai', 'gemini', or 'claude'
 * @returns {object} Provider service module
 */
function getProviderService(providerName) {
  const service = PROVIDERS[providerName.toLowerCase()];
  if (!service) {
    throw new Error(`Unknown AI provider: ${providerName}`);
  }
  return service;
}

/**
 * Build dynamic prompt for content generation
 * @param {object} config - Generation configuration
 * @returns {string} Formatted prompt
 */
function buildPrompt(config) {
  const {
    topics,
    tone = 'professional',
    targetLength = '800-1000',
    keywords = [],
    includeSEO = true,
    language = 'English',
  } = config;

  let prompt = `Write a blog post in ${language} with the following requirements:\n\n`;

  prompt += `**Topics**: ${topics.join(', ')}\n`;
  prompt += `**Tone**: ${tone}\n`;
  prompt += `**Target Length**: ${targetLength} words\n`;

  if (keywords.length > 0) {
    prompt += `**Keywords to include naturally**: ${keywords.join(', ')}\n`;
  }

  if (includeSEO) {
    prompt += `\n**SEO Requirements**:
- Include a catchy, SEO-optimized title (use # Markdown)
- Write a compelling introduction that hooks readers
- Use clear headings and subheadings (use ## or ###)
- Include practical examples or case studies
- Write a strong conclusion with a call-to-action
- Use short paragraphs for readability`;
  }

  prompt += `\n\nFormat the response as markdown. Start with the title using # Markdown.`;

  return prompt;
}

/**
 * Generate content using specified AI provider
 * @param {string} userId - User ID
 * @param {object} config - Generation configuration
 * @returns {Promise<object>} Generated post object
 */
async function generatePost(userId, config) {
  try {
    const {
      provider = 'openai',
      model,
      topics = [],
      tone = 'professional',
      targetLength = '800-1000',
      keywords = [],
      includeSEO = true,
      autoPublish = false,
      publishTargets = [],
      temperature = 0.7,
      maxTokens = 2000,
    } = config;

    if (!topics || topics.length === 0) {
      throw new Error('At least one topic is required');
    }

    // Get user's AI config from Firestore
    const db = getFirestore();
    const configDoc = await db.collection('ai_configs').doc(userId).get();

    if (!configDoc.exists) {
      throw new Error('No AI configuration found. Please set up API keys first.');
    }

    const userConfig = configDoc.data();
    const providerConfig = userConfig.providers[provider];

    if (!providerConfig || !providerConfig.enabled) {
      throw new Error(`${provider} is not configured or enabled`);
    }

    // Decrypt API key
    const apiKey = decrypt(providerConfig.apiKey);
    const providerService = getProviderService(provider);
    const selectedModel = model || providerConfig.activeModel;

    // Build prompt
    const prompt = buildPrompt({
      topics,
      tone,
      targetLength,
      keywords,
      includeSEO,
    });

    console.log(`[Generator] Starting generation with ${provider}/${selectedModel}`);

    // Generate content
    const generationResult = await providerService.generateContent({
      apiKey,
      model: selectedModel,
      prompt,
      temperature,
      maxTokens,
    });

    // Extract metadata from content
    const title = providerService.extractTitle(generationResult.content);
    const excerpt = providerService.extractExcerpt(generationResult.content);

    // Create post object for Firestore
    const post = {
      userId,
      status: autoPublish ? 'scheduled' : 'draft',
      title,
      content: generationResult.content,
      excerpt,
      metadata: {
        topics,
        keywords,
        tone,
        language: 'English',
        readingTime: Math.ceil(generationResult.content.split(/\s+/).length / 200), // 200 words per minute
        seoScore: includeSEO ? 85 : 60, // Rough estimate
      },
      generationConfig: {
        provider,
        model: selectedModel,
        temperature,
        maxTokens,
        prompt, // Store for reference (can be removed if space is concern)
      },
      publishing: {
        targets: publishTargets,
        scheduledAt: autoPublish ? new Date() : null,
        publishedAt: null,
        publishUrls: {},
      },
      tokens: generationResult.tokens,
      finishReason: generationResult.finishReason,
      errorLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save post to Firestore
    const postsRef = db.collection('ai_posts');
    const docRef = await postsRef.add(post);

    // Log generation event
    await db.collection('ai_logs').add({
      userId,
      action: 'generation',
      status: 'success',
      provider,
      postId: docRef.id,
      message: `Generated post with ${provider}`,
      metrics: {
        tokenUsed: generationResult.tokens,
        generationTimeMs: 0, // Could track this more precisely
      },
      timestamp: new Date(),
    });

    return {
      postId: docRef.id,
      ...post,
    };
  } catch (error) {
    console.error('Post generation failed:', error);

    // Log error
    try {
      const db = getFirestore();
      await db.collection('ai_logs').add({
        userId,
        action: 'generation',
        status: 'failed',
        provider: config.provider || 'unknown',
        message: error.message,
        errorDetails: {
          stack: error.stack,
        },
        timestamp: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    throw error;
  }
}

/**
 * Get generated posts for user
 * @param {string} userId - User ID
 * @param {object} filter - Filter options (status, limit, page)
 * @returns {Promise<object>} { posts, total, pages }
 */
async function getPosts(userId, filter = {}) {
  try {
    const db = getFirestore();
    const {
      status,
      limit = 20,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    let query = db.collection('ai_posts').where('userId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Get total count
    const countQuery = await query.count().get();
    const total = countQuery.data().count;
    const pages = Math.ceil(total / limit);

    // Get paginated results
    const offset = (page - 1) * limit;
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';
    const snapshot = await query
      .orderBy(sortBy, direction)
      .limit(limit)
      .offset(offset)
      .get();

    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return { posts, total, pages, page };
  } catch (error) {
    console.error('Failed to get posts:', error);
    throw error;
  }
}

/**
 * Get single post by ID
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @returns {Promise<object>} Post data
 */
async function getPost(userId, postId) {
  try {
    const db = getFirestore();
    const doc = await db.collection('ai_posts').doc(postId).get();

    if (!doc.exists) {
      throw new Error('Post not found');
    }

    const post = doc.data();

    // Verify ownership
    if (post.userId !== userId) {
      throw new Error('Unauthorized: This post does not belong to you');
    }

    return {
      id: doc.id,
      ...post,
    };
  } catch (error) {
    console.error('Failed to get post:', error);
    throw error;
  }
}

/**
 * Update post
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated post
 */
async function updatePost(userId, postId, updates) {
  try {
    const db = getFirestore();

    // Verify ownership first
    const post = await getPost(userId, postId);

    const allowedFields = ['title', 'content', 'excerpt', 'metadata', 'status'];
    const filteredUpdates = {};

    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updatedAt = new Date();

    await db.collection('ai_posts').doc(postId).update(filteredUpdates);

    return {
      id: postId,
      ...post,
      ...filteredUpdates,
    };
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
}

/**
 * Delete post
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @returns {Promise<boolean>} Success
 */
async function deletePost(userId, postId) {
  try {
    const db = getFirestore();

    // Verify ownership
    await getPost(userId, postId);

    await db.collection('ai_posts').doc(postId).delete();

    // Log deletion
    await db.collection('ai_logs').add({
      userId,
      action: 'deletion',
      status: 'success',
      postId,
      message: 'Post deleted',
      timestamp: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw error;
  }
}

module.exports = {
  generatePost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  buildPrompt,
  getProviderService,
};
