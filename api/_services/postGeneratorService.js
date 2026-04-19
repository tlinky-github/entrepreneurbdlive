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
      customPrompt = null,
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
      
      // Senior Engineer Fix: Allow iterations for custom prompts too, and scale with word count
      const MAX_ITERATIONS = Math.max(customPrompt ? 3 : 5, Math.ceil(targetWordCount / 400)); 
      
      const topicsStr = topics.join(', ');
      const keywordsStr = keywords.join(', ');

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        
        let currentPrompt = '';
        const currentWordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;

        if (customPrompt && iterations === 1) {
          // Process placeholders for initial custom prompt
          currentPrompt = customPrompt
            .replace(/\[Topic\]/gi, topics[0] || topicsStr)
            .replace(/\{topic\}/gi, topics[0] || topicsStr)
            .replace(/\[Keywords\]/gi, keywordsStr)
            .replace(/\{keywords\}/gi, keywordsStr)
            .replace(/\[Tone\]/gi, tone)
            .replace(/\{tone\}/gi, tone);
        } else if (iterations === 1) {
          // Initial default prompt
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

TECHNICAL SPECIFICATIONS:
- Output ONLY the HTML content.
- Do NOT include the Title in the body.
- Do NOT use <h1> tags.
- Write the ENTIRE, complete blog post from start to finish. Include the conclusion at the end.

Post Content (HTML):`;
        } else {
          // Continuation prompt - used for both default and custom prompts when cut off
          currentPrompt = `Act as a professional blogger. You are CONTINUING a blog post that was cut off.
          
Original Topic: ${topicsStr}
Current Word Count: ${currentWordCount} words
Target Word Count: ${targetWordCount} words

The content already generated is:
---
${fullContent.substring(Math.max(0, fullContent.length - 1200))} 
---

CONTINUATION REQUIREMENTS:
1. PICK UP EXACTLY where the previous text left off. Do NOT repeat yourself.
2. Do NOT restart the post. Do NOT provide an introduction.
3. Resume the flow naturally using HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>).
4. If you were in the middle of a sentence or a list, finish it first.
5. Provide a Conclusion ONLY if you have reached the substantive depth required for a ${targetWordCount} word post.

Next Section of Post (HTML):`;
        }

        // Generate content for this batch
        const result = await providerService.generateContent(
          apiKey,
          currentPrompt,
          model,
          { temperature, maxTokens, tokenMode: options.tokenMode }
        );

        fullContent += (iterations > 1 ? ' ' : '') + result.content.trim();
        totalTokensUsed += result.tokensUsed || 0;

        // Senior Engineer Fix: Logic to detect if we should stop
        const newWordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
        
        // 1. Check if the AI logically finished (Conclusion detected)
        const hasFinishedLogically = /<\/html>|<\/body>|conclusion|final thoughts|summary|call to action|cta/i.test(result.content.toLowerCase());
        
        // 2. Check if the AI was cut off mid-sentence (ends with common punctuation?)
        const endsWithPunctuation = /[.!?]>$/.test(result.content.trim());
        const isCutOff = !endsWithPunctuation && !hasFinishedLogically;

        // Decisions
        if (newWordCount >= targetWordCount * 0.95 && !isCutOff) {
          break; // Close enough and ends cleanly
        }
        
        if (hasFinishedLogically && newWordCount >= targetWordCount * 0.7) {
          break; // Finished logically and has decent length
        }
        
        // Otherwise, keep looping (continuation logic will trigger in next iteration)
      }

      const generationTime = Date.now() - startTime;

      // Extract title and excerpt
      const titlePrompt = `Extract a compelling title for this blog post (max 80 chars):\n\n${fullContent.substring(0, 500)}`;
      const titleResult = await providerService.generateContent(apiKey, titlePrompt, model, { 
        maxTokens: 100,
        tokenMode: options.tokenMode
      });

      const title = titleResult.content.trim().replace(/^["']|["']$/g, '');

      // AI Overview (SGE Style block)
      const overviewBlock = await this.generateSummary(apiKey, providerService, model, fullContent, options.tokenMode);

      // Senior Engineer Fix: Extract clean text "Quick Answer" for the Short Description field
      const quickAnswerMatch = (overviewBlock || "").match(/<div class="quick-answer">([\s\S]*?)<\/div>/i);
      const cleanQuickAnswer = quickAnswerMatch 
        ? quickAnswerMatch[1].replace(/<strong>Quick Answer:<\/strong>/i, '').replace(/<[^>]*>?/gm, '').trim()
        : '';

      // Related Content Widget
      const isKnowledge = targetDestination === 'knowledge';
      const destinationCollection = isKnowledge ? 'resources' : 'posts';
      const relatedWidget = await this.getRelatedContentWidget(destinationCollection, options.categoryId, null);

      // Assemble final HTML with premium additions
      const finalizedContent = `${overviewBlock.trim()}\n${fullContent.trim()}\n${relatedWidget.trim()}`;

      // Clean up the content_html for the database (Senior Engineer Fix)
      // Removes ALL inline classes and styles to ensure semantic purity
      const cleanContentHtml = (html) => {
        return html
          .replace(/^(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+/gi, '') // Trim top
          .replace(/(<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|<br\s*\/?>|\s)+$/gi, '') // Trim bottom
          .replace(/<p><strong>SEO Title:<\/strong>.*?<\/p>/gi, '') // Remove redundant text
          .replace(/<p><strong>Meta Description:<\/strong>.*?<\/p>/gi, '') 
          .replace(/\s+class=["'][^"']*["']/gi, '') // STRIP ALL CLASSES
          .replace(/\s+style=["'][^"']*["']/gi, ''); // STRIP ALL INLINE STYLES
      };

      const contentDoc = {
        userId,
        title: title || 'Untitled Post',
        content_html: cleanContentHtml(finalizedContent),
        excerpt: cleanQuickAnswer || stripHtml(fullContent).substring(0, 180) + '...',
        slug: (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        status: targetStatus || 'draft',
        provider: provider.toLowerCase(),
        model,
        tokensUsed: totalTokensUsed,
        generationTime,
        featured_image: options.featuredImage || null, // Sync from options
        category_id: options.categoryId || null,
        category_name: options.categoryName || null,
        authorId: options.authorId || null,
        author_name: options.authorName || null,
        scheduled_at: options.scheduledAt ? new Date(options.scheduledAt) : null,
        is_ai_generated: true,
        created_at: new Date(),
        updated_at: new Date(),
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
        
        // Inject so it appears in the editor natively
        if (contentDoc.faqs.length > 0) {
          const faqsJson = JSON.stringify(contentDoc.faqs).replace(/'/g, "&apos;");
          contentDoc.content_html = contentDoc.content_html.trim() + `\n<faq-section data-faqs='${faqsJson}'></faq-section>`;
        }
        
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
   IMPORTANT: Only generate FAQs that answer vital, search-intent driven questions. Avoid summarizing descriptive paragraphs.
2. Generate a valid Article/FAQPage JSON-LD Schema (Schema.org) for this content.

FORMATTING RULES:
- Use <h4> tags for the Questions.
- Use <p> tags for the Answers.
- DO NOT use any "style" or "class" attributes.

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
  
  async generateSummary(apiKey, providerService, model, content, tokenMode) {
    const summaryPrompt = `Based on the following blog content, generate two things for an AI search snippet:
1. "Quick Answer": An authoritative 1-2 sentence direct output responding to the article's core topic.
2. "Key Takeaways": 3-4 ultra-concise bullet points summarizing the key value.

Requirements:
1. Structure the output EXACTLY as the HTML snippet shown below.
2. Use a <h4> tag with the text "Key Takeaways".
3. Wrap everything in a <aside class="ai-overview-block">.
4. Do NOT use markdown. Use HTML tags exactly as shown.

EXAMPLE STRUCTURE (FOLLOW THIS EXACTLY):
<aside class="ai-overview-block">
  <div class="quick-answer">
    <strong>Quick Answer:</strong> [Your 1-2 sentence direct answer here]
  </div>
  <h4>Key Takeaways</h4>
  <ul>
    <li>Key point one here</li>
    <li>Key point two here</li>
    <li>Key point three here</li>
  </ul>
</aside>

Content: 
${content.substring(0, 3000)}

HTML Output:`;

    try {
      const result = await providerService.generateContent(apiKey, summaryPrompt, model, { 
        maxTokens: 500,
        tokenMode
      });
      return result.content || '';
    } catch (e) {
      console.error('Summary generation failed:', e);
      return '';
    }
  },

  async getRelatedContentWidget(destinationCollection, categoryId, excludeId) {
    if (!categoryId) return '';
    const db = getFirestore();
    
    try {
      // Find 6 most recent published items in the same category
      // For Blog (posts), it's category_id. For Knowledge (resources), it's category.
      const collName = (destinationCollection === 'knowledge' || destinationCollection === 'resources') ? 'resources' : 'posts';
      const catField = collName === 'resources' ? 'category' : 'category_id';
      
      let q = db.collection(collName)
        .where('status', '==', 'published')
        .where(catField, '==', categoryId);

      const snapshot = await q.orderBy('created_at', 'desc').limit(7).get();
      
      const relatedItems = snapshot.docs
        .filter(doc => doc.id !== excludeId)
        .slice(0, 6)
        .map(doc => ({ id: doc.id, ...doc.data() }));

      if (relatedItems.length === 0) return '';

      const itemsHtml = relatedItems.map(item => {
        const routePrefix = destinationCollection === 'knowledge' ? '/knowledge' : '/blog';
        const url = `${routePrefix}/${item.slug}`;
        const imgSrc = item.featured_image || 'https://via.placeholder.com/400x225?text=No+Image';
        
        return `
          <a href="${url}" class="related-post-card">
            <div class="related-post-thumb">
              <img src="${imgSrc}" alt="${item.title}" loading="lazy" />
            </div>
            <div class="related-post-title">${item.title}</div>
          </a>
        `;
      }).join('');

      return `
        <section class="related-posts-widget">
          <h3>Related Reading</h3>
          <div class="related-posts-grid">
            ${itemsHtml}
          </div>
        </section>
      `;
    } catch (e) {
      console.error('Related widget failed:', e);
      return '';
    }
  },

  async copilotAction(userId, options = {}) {
    const { provider, model, profileIndex = 0, action = 'rewrite', text = '', prompt = '' } = options;
    const db = getFirestore();
    
    try {
      // Get user's provider config
      const configDoc = await db.collection('ai_configs').doc(userId).get();
      if (!configDoc.exists) throw new Error('No AI provider configured');

      const config = configDoc.data();
      const providerLower = provider.toLowerCase();
      const providerConfig = config.providers?.[providerLower];

      if (!providerConfig) throw new Error(`Provider ${provider} not configured`);

      // Get the correct API key based on profileIndex
      let apiKey;
      if (providerConfig.profiles && providerConfig.profiles[profileIndex]) {
        apiKey = providerConfig.profiles[profileIndex].apiKey;
      } else {
        apiKey = providerConfig.apiKey;
      }

      if (!apiKey) throw new Error('No API key found for this profile');
      apiKey = decrypt(apiKey);

      const providerService = this.getProviderService(provider);
      if (!providerService) throw new Error('Unknown provider');

      let systemPrompt = '';
      if (!text && prompt) {
          systemPrompt = `Act as an expert content writer. Follow this prompt and return ONLY the generated text in HTML format if applicable, without markdown code blocks. PROMPT: ${prompt}`;
      } else {
          switch (action) {
            case 'rewrite':
              systemPrompt = `Rewrite the following text to be more professional, engaging, and clear. Output ONLY the rewritten text, preserving any original HTML tags structure if they exist. \n\nTEXT:\n${text}`;
              break;
            case 'expand':
              systemPrompt = `Expand upon the following text. Add more detail, examples, or context where appropriate. Output ONLY the expanded text, preserving HTML tags.\n\nTEXT:\n${text}`;
              break;
            case 'summarize':
              systemPrompt = `Summarize the following text into a very concise paragraph. Output ONLY the summary.\n\nTEXT:\n${text}`;
              break;
            case 'grammar':
              systemPrompt = `Fix all spelling and grammar mistakes in the following text without drastically changing its meaning. Output ONLY the fixed text, preserving HTML.\n\nTEXT:\n${text}`;
              break;
            case 'custom':
              systemPrompt = `Follow the user instructions relative to the text. Output ONLY the resulting text.\n\nINSTRUCTIONS: ${prompt}\n\nTEXT:\n${text}`;
              break;
            default:
              systemPrompt = text;
          }
      }

      const result = await providerService.generateContent(
        apiKey,
        systemPrompt,
        model,
        { temperature: 0.7, maxTokens: 1000 }
      );

      // Log copilot generation
      await db.collection('ai_logs').add({
        userId,
        action: 'copilot_' + action,
        status: 'success',
        provider: providerLower,
        model,
        tokensUsed: result.tokensUsed || 0,
        timestamp: new Date(),
      });

      return { success: true, text: result.content.replace(/^\s*[\"\']|[\"\']\s*$/g, '') };
    } catch (error) {
      await db.collection('ai_logs').add({
        userId,
        action: 'copilot_' + action,
        status: 'error',
        error: error.message,
        timestamp: new Date(),
      });
      throw error;
    }
  },
};

module.exports = postGeneratorService;
