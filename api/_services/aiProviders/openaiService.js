// OpenAI Service - GPT-4, GPT-3.5
const OpenAI = require('openai');

const openaiService = {
  async testConnection(apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      
      // List available models
      const models = await openai.models.list();
      
      // Filter GPT models that support chat/completions (exclude "instruct" models)
      const gptModels = (models.data || [])
        .filter((m) => m && m.id && (m.id.startsWith('gpt-') || m.id.startsWith('o1-') || m.id.startsWith('o3-')) && !m.id.includes('instruct'))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 10);
      
      const finalModels = gptModels.length > 0 ? gptModels : [];

      if (finalModels.length === 0) {
        throw new Error('No GPT models found for this account.');
      }

      return {
        success: true,
        models: finalModels,
        message: 'OpenAI API key is valid',
      };
    } catch (error) {
      return {
        success: false,
        message: `OpenAI validation failed: ${error.message}`,
      };
    }
  },

  async generateContent(apiKey, prompt, model, options = {}) {
    let params = { model: model || 'unspecified' };
    try {
      const openai = new OpenAI({ apiKey });

      const tokenMode = options.tokenMode || 'auto';
      let useCompletionTokens = false;

      if (tokenMode === 'auto') {
        const isReasoning = /o[13]|o-?\d/i.test(model);
        useCompletionTokens = isReasoning;
      } else if (tokenMode === 'max_completion_tokens') {
        useCompletionTokens = true;
      }

      params = {
        model,
        messages: [{ role: 'user', content: prompt }],
      };

      if (useCompletionTokens) {
        // Reasoning models (o1, o3, etc) or forced completion tokens mode
        params.max_completion_tokens = options.maxTokens || 2000;
        // Temperature and top_p are NOT supported by reasoning models yet
        if (tokenMode === 'auto' && /^o\d/.test(model)) {
          // Only omit if we are in auto mode and it is a reasoning model
          // If the user manually chose this mode for a non-reasoning model, we might still send temperature if they want
        }
      } else {
        params.max_tokens = options.maxTokens || 2000;
        params.temperature = options.temperature || 0.7;
      }

      const response = await openai.chat.completions.create(params);

      const content = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        success: true,
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      const debugInfo = `Model: ${model}, Params: ${Object.keys(params).join(',')}`;
      throw new Error(`OpenAI generation failed: ${error.message} [DEBUG: ${debugInfo}]`);
    }
  },

  async extractTitle(apiKey, content) {
    try {
      const response = await this.generateContent(
        apiKey,
        `Extract a concise title (max 100 chars) for this post:\n\n${content}`,
        'gpt-3.5-turbo',
        { maxTokens: 100 }
      );
      return response.content.trim();
    } catch (error) {
      return 'Untitled Post';
    }
  },

  async extractExcerpt(apiKey, content) {
    try {
      const response = await this.generateContent(
        apiKey,
        `Extract a brief excerpt (max 200 chars) for this post:\n\n${content}`,
        'gpt-3.5-turbo',
        { maxTokens: 150 }
      );
      return response.content.trim();
    } catch (error) {
      return content.substring(0, 200) + '...';
    }
  },

  async getAvailableModels(apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const models = await openai.models.list();

      const availableModels = (models.data || [])
        .filter((m) => m && m.id && (m.id.startsWith('gpt-') || m.id.startsWith('o1-') || m.id.startsWith('o3-')) && !m.id.includes('instruct'))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 30);

      if (!availableModels || availableModels.length === 0) {
        throw new Error(`No compatible chat models found. Ensure your key has GPT model access.`);
      }

      return availableModels;
    } catch (error) {
      console.error('OpenAI getAvailableModels error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  },
};

module.exports = openaiService;
