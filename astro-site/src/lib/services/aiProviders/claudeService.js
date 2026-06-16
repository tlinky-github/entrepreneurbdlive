import Anthropic from '@anthropic-ai/sdk';

const claudeService = {
  async testConnection(apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey: apiKey?.trim() });
      const models = await this.getAvailableModels(apiKey);

      return {
        success: true,
        models,
        message: 'Claude API key is valid',
      };
    } catch (error) {
      return {
        success: false,
        message: `Claude validation failed: ${error.message}`,
      };
    }
  },

  async generateContent(apiKey, prompt, model, options = {}) {
    try {
      const anthropic = new Anthropic({ apiKey: apiKey?.trim() });

      const response = await anthropic.messages.create({
        model,
        max_tokens: options.maxTokens || 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;

      return {
        success: true,
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      throw new Error(`Claude generation failed: ${error.message}`);
    }
  },

  async getAvailableModels(apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey?.trim(),
          'anthropic-version': '2023-06-01'
        }
      });
      if (!response.ok) throw new Error(`Anthropic API responded with status: ${response.status}`);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const validModels = data.data.map(model => model.id);
        if (validModels.length > 0) return validModels;
      }
      throw new Error('No valid models found in Anthropic response');
    } catch (error) {
      throw new Error(`Failed to fetch Claude models: ${error.message}`);
    }
  },
};

export default claudeService;
