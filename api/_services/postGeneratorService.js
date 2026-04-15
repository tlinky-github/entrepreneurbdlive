// Post Generator Service - Orchestration layer
const { getFirestore } = require('./firebaseService');
const { decrypt } = require('./encryptionService');
const openaiService = require('./aiProviders/openaiService');
const geminiService = require('./aiProviders/geminiService');
const claudeService = require('./aiProviders/claudeService');

const postGeneratorService = {
  getProviderService(provider) {
    const providers = {
      openai: openaiService,
      gemini: geminiService,
      claude: claudeService,
    };
    return providers[provider.toLowerCase()];
  },

  async generatePost(userId, options = {}) {
    const {
      provider,
      model,
      topics = [],
      tone = 'informative',
      keywords = [],
      temperature = 0.7,
      maxTokens = 1500,
      language = 'en',
    } = options;

    const db = getFirestore();

    try {
      // Get user's provider config
      const configDoc = await db.collection('ai_configs').doc(userId).get();
      if (!configDoc.exists) {
        throw new Error('No AI provider configured');
      }

      const config = configDoc.data();
      const providerConfig = config.providers?.[provider.toLowerCase()];

      if (!providerConfig) {
        throw new Error(`Provider ${provider} not configured`);
      }

      // Decrypt API key
      let apiKey;
      try {
        apiKey = decrypt(providerConfig.apiKey);
      } catch (e) {
        throw new Error('Failed to decrypt API key');
      }

      // Get provider service
      const providerService = this.getProviderService(provider);
      if (!providerService) {
        throw new Error(`Unknown provider: ${provider}`);
      }

      // Build prompt
      const topicsStr = topics.join(', ');
      const keywordsStr = keywords.join(', ');

      const prompt = `Generate a ${tone} blog post about: ${topicsStr}
Keywords to include: ${keywordsStr}
Language: ${language}
Tone: ${tone}

Write a comprehensive, engaging post suitable for a blog. Include:
- Engaging introduction
- Main content sections
- Practical tips/insights
- Conclusion

Keep it informative and scannable.`;

      const startTime = Date.now();

      // Generate content
      const result = await providerService.generateContent(
        apiKey,
        prompt,
        model,
        { temperature, maxTokens }
      );

      const generationTime = Date.now() - startTime;
      const tokensUsed = result.tokensUsed || 0;

      // Extract title and excerpt
      const titlePrompt = `Extract a compelling title for this blog post (max 80 chars):\n\n${result.content.substring(0, 500)}`;
      const titleResult = await providerService.generateContent(apiKey, titlePrompt, model, {
        maxTokens: 50,
      });
      const title = titleResult.content.trim().replace(/^["']|["']$/g, '');

      // Create post document
      const postData = {
        userId,
        title: title || 'Untitled Post',
        content: result.content,
        excerpt: result.content.substring(0, 200) + '...',
        provider: provider.toLowerCase(),
        model,
        topics,
        keywords,
        tone,
        language,
        status: 'draft',
        tokensUsed,
        generationTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      const postRef = await db.collection('ai_posts').add(postData);

      // Log generation
      await db.collection('ai_logs').add({
        userId,
        postId: postRef.id,
        action: 'generate',
        status: 'success',
        provider: provider.toLowerCase(),
        model,
        tokensUsed,
        generationTime,
        timestamp: new Date(),
      });

      return {
        success: true,
        post: {
          id: postRef.id,
          ...postData,
        },
      };
    } catch (error) {
      // Log error
      await db.collection('ai_logs').add({
        userId,
        action: 'generate',
        status: 'error',
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  },

  async getPosts(userId, filters = {}) {
    const db = getFirestore();
    const { status = 'all', limit = 10, page = 1 } = filters;

    try {
      let query = db.collection('ai_posts').where('userId', '==', userId);

      if (status && status !== 'all') {
        query = query.where('status', '==', status);
      }

      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      const pageNum = Math.max(parseInt(page) || 1, 1);
      const limitNum = Math.min(parseInt(limit) || 10, 100);
      const offset = (pageNum - 1) * limitNum;

      const posts = [];
      totalSnapshot.forEach((snap) => {
        if (posts.length >= offset && posts.length < offset + limitNum) {
          posts.push({ id: snap.id, ...snap.data() });
        }
      });

      return {
        posts,
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      };
    } catch (error) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }
  },

  async updatePost(userId, postId, updates) {
    const db = getFirestore();

    try {
      const postRef = db.collection('ai_posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      if (postDoc.data().userId !== userId) {
        throw new Error('Unauthorized: You can only update your own posts');
      }

      updates.updatedAt = new Date();
      await postRef.update(updates);

      return { success: true, ...updates };
    } catch (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }
  },

  async deletePost(userId, postId) {
    const db = getFirestore();

    try {
      const postRef = db.collection('ai_posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      if (postDoc.data().userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own posts');
      }

      await postRef.delete();

      await db.collection('ai_logs').add({
        userId,
        postId,
        action: 'delete',
        status: 'success',
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  },

  async getLogs(userId, filters = {}) {
    const db = getFirestore();
    const { limit = 100, filter = 'all' } = filters;

    try {
      let query = db.collection('ai_logs').where('userId', '==', userId);

      if (filter !== 'all') {
        query = query.where('action', '==', filter);
      }

      const limitNum = Math.min(parseInt(limit) || 100, 500);
      const logsSnapshot = await query.orderBy('timestamp', 'desc').limit(limitNum).get();

      const logs = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return logs;
    } catch (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  },
};

module.exports = postGeneratorService;
