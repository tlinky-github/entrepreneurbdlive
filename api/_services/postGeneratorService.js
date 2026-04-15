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

      // Parse target word count from options
      let targetWordCount = 800;
      if (typeof options.targetLength === 'string') {
        const matches = options.targetLength.match(/\d+/g);
        if (matches && matches.length > 0) {
          // Use the higher number if it's a range (e.g., "800-1000" -> 1000)
          targetWordCount = Math.max(...matches.map(Number));
        }
      } else if (typeof options.targetLength === 'number') {
        targetWordCount = options.targetLength;
      }

      const startTime = Date.now();
      let fullContent = '';
      let totalTokensUsed = 0;
      let iterations = 0;
      const MAX_ITERATIONS = 4; // Prevent infinite loops
      const topicsStr = topics.join(', ');
      const keywordsStr = keywords.join(', ');

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        
        let currentPrompt = '';
        const currentWordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;

        if (iterations === 1) {
          // Initial prompt
          currentPrompt = `Act as an expert content creator and professional blogger. Your goal is to generate a comprehensive, high-quality, and highly engaging blog post in ${language}.
          
Topic: ${topicsStr}
Keywords to include naturally: ${keywordsStr}
Tone: ${tone}
Target Language: ${language}
Target Word Count: ${targetWordCount} words

STRUCTURAL REQUIREMENTS:
1. OVERVIEW/HOOK: Start with a powerful, attention-grabbing introduction that clearly states the value proposition.
2. SUBHEADINGS: Use SEO-friendly, descriptive H2 and H3 subheadings.
3. CONTENT DEPTH: Provide actionable insights and deep value.
4. FORMATTING: Use Markdown formatting (bold, italics, lists, blockquotes).
5. ENGAGEMENT: Maintain the "${tone}" voice consistently.

TECHNICAL SPECIFICATIONS:
- Output only the Markdown content of the post.
- Ensure the keyword integration is seamless.
- This is PART 1 of the generation. Focus on the Introduction and the first few major sections.
- Goal for this batch: ~500-700 words.

Post Content:`;
        } else {
          // Continuation prompt
          currentPrompt = `Act as a professional blogger. You are continuing a blog post.
          
Original Topic: ${topicsStr}
Current Word Count: ${currentWordCount} words
Target Word Count: ${targetWordCount} words

The content already generated is:
---
${fullContent.substring(Math.max(0, fullContent.length - 1500))} 
---

CONTINUATION REQUIREMENTS:
1. PICK UP EXACTLY where the previous text left off.
2. Do NOT repeat the introduction or previously covered points.
3. Focus on expanding the remaining sections or adding new depth to reach the ${targetWordCount} word goal.
4. Maintain the "${tone}" tone and Markdown formatting.
5. If you have covered everything and reached near ${targetWordCount} words, provide a strong Conclusion & CTA.

Next Section of Post:`;
        }

        // Generate content for this batch
        const result = await providerService.generateContent(
          apiKey,
          currentPrompt,
          model,
          { temperature, maxTokens }
        );

        fullContent += (iterations > 1 ? '\n\n' : '') + result.content.trim();
        totalTokensUsed += result.tokensUsed || 0;

        // Check if we reached the target or if the AI signaled completion
        const newWordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
        
        // If we are within 10% of target or AI seems to have finished (contains Conclusion header/CTA)
        const hasFinished = /conclusion|final thoughts|summary|call to action|cta/i.test(result.content.toLowerCase());
        
        if (newWordCount >= targetWordCount * 0.9 || hasFinished) {
          break;
        }
      }

      const generationTime = Date.now() - startTime;

      // Extract title and excerpt
      const titlePrompt = `Extract a compelling title for this blog post (max 80 chars):\n\n${fullContent.substring(0, 500)}`;
      const titleResult = await providerService.generateContent(apiKey, titlePrompt, model, {
        maxTokens: 50,
      });
      const title = titleResult.content.trim().replace(/^["']|["']$/g, '');

      // Create post document
      const postData = {
        userId,
        title: title || 'Untitled Post',
        content: fullContent,
        excerpt: fullContent.substring(0, 200) + '...',
        provider: provider.toLowerCase(),
        model,
        topics,
        keywords,
        tone,
        language,
        status: 'draft',
        tokensUsed: totalTokensUsed,
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
        tokensUsed: totalTokensUsed,
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
