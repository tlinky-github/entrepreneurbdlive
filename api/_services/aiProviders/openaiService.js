// OpenAI Service - GPT-4, GPT-3.5
const OpenAI = require('openai');

const openaiService = {
  async testConnection(apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      
      // List available models
      const models = await openai.models.list();
      
      console.log(`[DEBUG] OpenAI models.list() returned ${models.data?.length || 0} models`);
      if (models.data?.length > 0) {
        console.log(`[DEBUG] First 5 models: ${models.data.slice(0, 5).map(m => m.id).join(', ')}`);
      }
      
      // Filter GPT models
      const gptModels = (models.data || [])
        .filter((m) => m && m.id && m.id.includes('gpt'))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 10); // Get latest 10
      
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

  async generateContent(apiKey, prompt, model = 'gpt-4-turbo', options = {}) {
    try {
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      });

      const content = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        success: true,
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
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

      console.log(`[DEBUG] OpenAI getAvailableModels returned ${models.data?.length || 0} models`);

      const availableModels = (models.data || [])
        .filter((m) => m && m.id && (m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3')))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 30);

      if (!availableModels || availableModels.length === 0) {
        const foundSample = (models.data || []).slice(0, 5).map(m => m.id).join(', ');
        throw new Error(`No GPT models found. Found these instead: ${foundSample || 'none'}. Ensure your key has model access.`);
      }

      return availableModels;
    } catch (error) {
      console.error('OpenAI getAvailableModels error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  },
};

module.exports = openaiService;
