import OpenAI from 'openai';

const openaiService = {
  async testConnection(apiKey) {
    try {
      const openai = new OpenAI({ apiKey: apiKey?.trim() });
      const models = await openai.models.list();
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
    if (!model) throw new Error('AI Model must be specified');
    let params = { model: model || 'unspecified' };
    try {
      const openai = new OpenAI({ apiKey: apiKey?.trim() });

      const tokenMode = options.tokenMode || 'auto';
      let useCompletionTokens = false;

      if (tokenMode === 'auto') {
        const isNewerModel = /o[13]|o-?\d|gpt-5|nano|mini/i.test(model);
        useCompletionTokens = isNewerModel;
      } else if (tokenMode === 'max_completion_tokens') {
        useCompletionTokens = true;
      }

      params = {
        model,
        messages: [{ role: 'user', content: prompt }],
      };

      if (useCompletionTokens) {
        params.max_completion_tokens = options.maxTokens || 2000;
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

  async getAvailableModels(apiKey) {
    try {
      const openai = new OpenAI({ apiKey: apiKey?.trim() });
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

export default openaiService;
