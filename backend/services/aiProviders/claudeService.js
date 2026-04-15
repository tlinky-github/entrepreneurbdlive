const Anthropic = require('@anthropic-ai/sdk');

/**
 * Anthropic Claude Service
 * Handles all Claude API interactions
 */

/**
 * Create an initialized Claude client
 * @param {string} apiKey - Anthropic API key
 * @returns {Anthropic} Initialized Claude client
 */
function createClaudeClient(apiKey) {
  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Test Claude connection and get available models
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<object>} { success, models, message }
 */
async function testConnection(apiKey) {
  try {
    const client = createClaudeClient(apiKey);

    // Test with a simple message to verify key works
    const message = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "OK"',
        },
      ],
    });

    if (message.content && message.content.length > 0) {
      return {
        success: true,
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        message: 'Claude connection successful',
      };
    }
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return {
      success: false,
      models: [],
      message: `Connection failed: ${error.message}`,
    };
  }
}

/**
 * Generate content using Claude
 * @param {object} config - Configuration object
 * @param {string} config.apiKey - Anthropic API key
 * @param {string} config.model - Model to use (e.g., 'claude-3-sonnet-20240229')
 * @param {string} config.prompt - The prompt for content generation
 * @param {number} config.temperature - Temperature (0-1), default 0.7
 * @param {number} config.maxTokens - Max tokens in response, default 2000
 * @returns {Promise<object>} { content, tokens, model, timestamp }
 */
async function generateContent(config) {
  const {
    apiKey,
    model = 'claude-3-sonnet-20240229',
    prompt,
    temperature = 0.7,
    maxTokens = 2000,
  } = config;

  try {
    const client = createClaudeClient(apiKey);

    console.log(`[Claude] Generating with ${model}...`);

    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: Math.min(Math.max(temperature, 0), 1),
      system: 'You are a professional content writer. Generate high-quality blog posts with proper markdown formatting.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0]?.text;

    if (!content) {
      throw new Error('No content generated');
    }

    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    return {
      content,
      tokens: tokensUsed,
      model: response.model,
      finishReason: response.stop_reason,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Claude generation failed:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

/**
 * Extract title from content
 * @param {string} content - Generated content
 * @returns {string} Extracted title or default
 */
function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ') || line.startsWith('## ')) {
      return line.replace(/^#+\s*/, '').trim();
    }
  }
  return content.substring(0, 60).trim();
}

/**
 * Extract excerpt from content
 * @param {string} content - Generated content
 * @returns {string} Excerpt (first 150 chars without markdown)
 */
function extractExcerpt(content) {
  const text = content.replace(/[#*_`[\]]/g, '').trim();
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
}

module.exports = {
  createClaudeClient,
  testConnection,
  generateContent,
  extractTitle,
  extractExcerpt,
};
