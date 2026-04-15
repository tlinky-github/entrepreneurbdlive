// Anthropic Claude Service
const Anthropic = require('@anthropic-ai/sdk');

const claudeService = {
  async testConnection(apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey });

      // Try to create a message to validate key
      const models = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];

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

  async generateContent(apiKey, prompt, model = 'claude-3-5-sonnet-20241022', options = {}) {
    try {
      const anthropic = new Anthropic({ apiKey });

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

  async extractTitle(apiKey, content) {
    try {
      const response = await this.generateContent(
        apiKey,
        `Extract a concise title (max 100 chars) for this post:\n\n${content}`,
        'claude-3-5-haiku-20241022',
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
        'claude-3-5-haiku-20241022',
        { maxTokens: 150 }
      );
      return response.content.trim();
    } catch (error) {
      return content.substring(0, 200) + '...';
    }
  },

  async getAvailableModels(apiKey) {
    try {
      // Anthropic Claude supported models (as of current API)
      const availableModels = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
      return availableModels;
    } catch (error) {
      throw new Error(`Claude API Error: ${error.message}`);
    }
  },
};

module.exports = claudeService;
