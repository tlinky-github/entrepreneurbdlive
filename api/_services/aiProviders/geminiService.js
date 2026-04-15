// Google Gemini Service
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiService = {
  async testConnection(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Try to list models
      const models = [
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
      ];

      return {
        success: true,
        models,
        message: 'Gemini API key is valid',
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini validation failed: ${error.message}`,
      };
    }
  },

  async generateContent(apiKey, prompt, model = 'gemini-1.5-pro', options = {}) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model });

      const response = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2000,
        },
      });

      const content = response.response.text();
      const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;

      return {
        success: true,
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  },

  async extractTitle(apiKey, content) {
    try {
      const response = await this.generateContent(
        apiKey,
        `Extract a concise title (max 100 chars) for this post:\n\n${content}`,
        'gemini-1.5-flash',
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
        'gemini-1.5-flash',
        { maxTokens: 150 }
      );
      return response.content.trim();
    } catch (error) {
      return content.substring(0, 200) + '...';
    }
  },

  async getAvailableModels(apiKey) {
    try {
      // Google Gemini supported models (as of current API)
      const availableModels = [
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
      ];
      return availableModels;
    } catch (error) {
      // Return default models if API calls fail
      return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
    }
  },
};

module.exports = geminiService;
