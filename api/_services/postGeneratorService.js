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
      targetLength = '1000',
      keywords = [],
      temperature = 0.7,
      maxTokens = 1500,
      language = 'en',
      targetDestination = 'blog', // 'blog' or 'knowledge'
      targetStatus = 'draft',      // 'draft' or 'published'
    } = options;

    const db = getFirestore();

    try {
      // Get user's provider config
      const configDoc = await db.collection('ai_configs').doc(userId).get();
      if (!configDoc.exists) {
        throw new Error('No AI provider configured');
      }

      const config = configDoc.data();
      const providerLower = provider.toLowerCase();
      const providerConfig = config.providers?.[providerLower];

      if (!providerConfig) {
        throw new Error(`Provider ${provider} not configured`);
      }

      // Get the correct API key based on profileIndex
      let apiKey;
      const profileIndex = options.profileIndex || 0;
      
      if (providerConfig.profiles && providerConfig.profiles[profileIndex]) {
        apiKey = providerConfig.profiles[profileIndex].apiKey;
      } else {
        // Fallback to legacy single key if profiles don't exist
        apiKey = providerConfig.apiKey;
      }

      if (!apiKey) {
        throw new Error(`No API key found for ${provider} profile ${profileIndex}`);
      }

      // Decrypt API key
      try {
        apiKey = decrypt(apiKey);
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
1. OVERVIEW/HOOK: Start with a powerful, attention-grabbing introduction.
2. SUBHEADINGS: Use SEO-friendly, descriptive H2 and H3 subheadings.
3. CONTENT DEPTH: Provide actionable insights and deep value.
4. FORMATTING: Use SEMANTIC HTML (<h2>, <h3>, <p>, <ul>, <li>, <strong>). Do NOT use Markdown (# or **).
5. ENGAGEMENT: Maintain the "${tone}" voice consistently.

TONE & CHARACTER POLICY:
- Use STRAIGHT QUOTES (") instead of curly quotes (“ ”).
- Use SIMPLE DASHES (-) instead of em-dashes (—).
- Write as an authoritative professional. Avoid conversational chat-style language.
- DO NOT start sentences with "So," or "Listen," or "Imagine this."

TECHNICAL SPECIFICATIONS:
- Output ONLY the HTML content.
- Do NOT include the Title in the body.
- Do NOT use <h1> tags.
- Do NOT include metadata like "Part 1" or labels.
- This is PART 1 of the generation.
- Goal for this batch: ~500-700 words.

Post Content (HTML):`;
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
3. Focus on expanding the remaining sections using HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
4. Maintain the "${tone}" tone.
5. Do NOT include "Part 2" or continuation labels.
6. Use STRAIGHT QUOTES (") and SIMPLE DASHES (-). Avoid conversational chatbot language.
7. If you have covered everything and reached near ${targetWordCount} words, provide a strong Conclusion & CTA (e.g., share this post or explore the directory).

Next Section of Post (HTML):`;
        }

        // Generate content for this batch
        const result = await providerService.generateContent(
          apiKey,
          currentPrompt,
          model,
          { temperature, maxTokens, tokenMode: options.tokenMode }
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
        maxTokens: 100,
        tokenMode: options.tokenMode
      });

      const title = titleResult.content.trim().replace(/^["']|["']$/g, '');

      // Create post document
      // Create post document with destination-specific data
      const isKnowledge = targetDestination === 'knowledge';
      const destinationCollection = isKnowledge ? 'resources' : 'posts';
      
      const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim();

      const contentDoc = {
        userId,
        title: title || 'Untitled Post',
        content_html: fullContent,
        excerpt: stripHtml(fullContent).substring(0, 180) + '...',
        slug: (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        status: targetStatus || 'draft',
        provider: provider.toLowerCase(),
        model,
        tokensUsed: totalTokensUsed,
        generationTime,
        category_id: options.categoryId || null,
        author_id: options.authorId || null,
        scheduledAt: options.scheduledAt ? new Date(options.scheduledAt) : null,
        is_ai_generated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add Knowledge-specific fields if needed
      if (isKnowledge) {
        contentDoc.type = 'knowledge';
        contentDoc.category = 'General';
      } else {
        contentDoc.topics = topics;
        contentDoc.keywords = keywords;
        contentDoc.tone = tone;
        contentDoc.language = language;
      }

      // SEO Enrichment
      if (options.includeSEO) {
        // Determine FAQ count: passed option > global settings > default (3)
        let minFaqCount = options.minFaqCount;
        if (!minFaqCount) {
          const configDoc = await db.collection('ai_configs').doc(userId).get();
          const settings = configDoc.exists ? (configDoc.data().settings || {}) : {};
          minFaqCount = settings.minFaqCount || 3;
        }

        const seoData = await this.generateSEOEnrichment(apiKey, providerService, model, title, fullContent, minFaqCount, options.tokenMode);
        contentDoc.faqs = seoData.faqs || [];
        contentDoc.custom_head_html = seoData.customHeadHtml || '';
        
        // Ensure SEO title/desc are also populated if not already
        contentDoc.seo_title = title;
        contentDoc.seo_description = stripHtml(fullContent).substring(0, 155).trim() + '...';
      }

      // Save to AI History (ai_posts) for tracking
      const historyRef = await db.collection('ai_posts').add({
        ...contentDoc,
        originalTopics: topics,
        originalKeywords: keywords
      });

      // Also save to the actual destination collection for live site
      const liveRef = await db.collection(destinationCollection).add(contentDoc);

      // Log generation
      await db.collection('ai_logs').add({
        userId,
        postId: historyRef.id,
        liveId: liveRef.id,
        action: 'generate',
        status: 'success',
        destination: targetDestination,
        provider: provider.toLowerCase(),
        model,
        tokensUsed: totalTokensUsed,
        generationTime,
        timestamp: new Date(),
      });

      return {
        success: true,
        post: {
          id: liveRef.id,
          historyId: historyRef.id,
          ...contentDoc,
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
      console.error('Title extraction failed:', error);
      return { success: false, content: 'Untitled Post' };
    }
  },

  async generateSEOEnrichment(apiKey, providerService, model, title, content, minFaqCount = 3, tokenMode = 'auto') {
    try {
      const seoPrompt = `Analyze the following title and content of a blog post, then generate high-quality SEO metadata.
      
TITLE: ${title}
CONTENT: ${content.substring(0, 3000)}

REQUEST:
1. Generate exactly ${minFaqCount} high-value FAQs (Question and Answer pairs) related to this topic.
2. Generate a valid Article/FAQPage JSON-LD Schema (Schema.org) for this content.

FORMAT: Use the following markers to wrap your response:
[FAQ_START]
JSON Array of objects { "q": "Question", "a": "Answer" }
[FAQ_END]

[SCHEMA_START]
Raw JSON-LD object (do not include script tags yet)
[SCHEMA_END]`;

      const result = await providerService.generateContent(apiKey, seoPrompt, model, { 
        maxTokens: 1500,
        tokenMode
      });

      const responseText = result.content;
      
      // Extract FAQs
      let faqs = [];
      const faqMatch = responseText.match(/\[FAQ_START\]([\s\S]*?)\[FAQ_END\]/);
      if (faqMatch && faqMatch[1]) {
        try {
          faqs = JSON.parse(faqMatch[1].trim());
        } catch (e) {
          console.error('Failed to parse AI FAQs:', e);
        }
      }

      // Extract Schema
      let schemaJson = '';
      const schemaMatch = responseText.match(/\[SCHEMA_START\]([\s\S]*?)\[SCHEMA_END\]/);
      if (schemaMatch && schemaMatch[1]) {
        schemaJson = schemaMatch[1].trim();
      }

      return {
        faqs,
        customHeadHtml: schemaJson ? `<script type="application/ld+json">\n${schemaJson}\n</script>` : ''
      };
    } catch (error) {
      console.error('SEO Enrichment failed:', error);
      return { faqs: [], customHeadHtml: '' };
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
