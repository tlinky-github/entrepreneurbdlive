// OpenAI Service - GPT-4, GPT-3.5
const OpenAI = require('openai');

const openaiService = {
  async testConnection(apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      
      // List available models
      const models = await openai.models.list();
      
      // Filter GPT models
      const gptModels = models.data
        .filter((m) => m.id.includes('gpt'))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 10); // Get latest 10

      return {
        success: true,
        models: gptModels.length > 0 ? gptModels : ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
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

      const availableModels = models.data
        .filter((m) => m.id.includes('gpt'))
        .map((m) => m.id)
        .sort()
        .reverse()
        .slice(0, 20);

      // Ensure some models exist
      if (availableModels.length === 0) {
        return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
      }

      return availableModels;
    } catch (error) {
      // Return default models if API calls fail
      return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    }
  },
};

module.exports = openaiService;
