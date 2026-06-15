import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiService = {
  async testConnection(apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const models = await this.getAvailableModels(apiKey);

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

  async generateContent(apiKey, prompt, model, options = {}) {
    try {
      if (!model) throw new Error('AI Model must be specified');
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

  async getAvailableModels(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Google API responded with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.models && Array.isArray(data.models)) {
        const validModels = data.models
          .filter(model => model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent'))
          .map(model => model.name.replace('models/', ''));

        if (validModels.length > 0) return validModels;
      }
      throw new Error('No valid generateContent models found in response');
    } catch (error) {
      console.warn('Dynamic fetch for Gemini models failed:', error.message);
      throw new Error(`Failed to fetch Gemini models: ${error.message}`);
    }
  },
};

export default geminiService;
