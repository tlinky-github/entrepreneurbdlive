const { OpenAI } = require('openai');

/**
 * OpenAI Service
 * Handles all OpenAI API interactions (ChatGPT, GPT-4)
 */

/**
 * Create an initialized OpenAI client
 * @param {string} apiKey - OpenAI API key
 * @returns {OpenAI} Initialized OpenAI client
 */
function createOpenAIClient(apiKey) {
  return new OpenAI({
    apiKey: apiKey,
    timeout: 60000,
  });
}

/**
 * Test OpenAI connection and get available models
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<object>} { success, models, message }
 */
async function testConnection(apiKey) {
  try {
    const client = createOpenAIClient(apiKey);

    // Test with a simple completion to verify key works
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "OK"' }],
      max_tokens: 10,
    });

    if (response.choices && response.choices.length > 0) {
      return {
        success: true,
        models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
        message: 'OpenAI connection successful',
      };
    }
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return {
      success: false,
      models: [],
      message: `Connection failed: ${error.message}`,
    };
  }
}

/**
 * Generate content using OpenAI
 * @param {object} config - Configuration object
 * @param {string} config.apiKey - OpenAI API key
 * @param {string} config.model - Model to use (e.g., 'gpt-4')
 * @param {string} config.prompt - The prompt for content generation
 * @param {number} config.temperature - Temperature (0-1), default 0.7
 * @param {number} config.maxTokens - Max tokens in response, default 2000
 * @returns {Promise<object>} { content, tokens, model, timestamp }
 */
async function generateContent(config) {
  const {
    apiKey,
    model = 'gpt-4',
    prompt,
    temperature = 0.7,
    maxTokens = 2000,
  } = config;

  try {
    const client = createOpenAIClient(apiKey);

    console.log(`[OpenAI] Generating with ${model}...`);

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional content writer. Generate high-quality blog posts with proper markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: Math.min(Math.max(temperature, 0), 1),
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) {
      throw new Error('No content generated');
    }

    return {
      content,
      tokens: tokensUsed,
      model: response.model,
      finishReason: response.choices[0].finish_reason,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('OpenAI generation failed:', error);
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
  // Fallback to first 60 chars
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
  createOpenAIClient,
  testConnection,
  generateContent,
  extractTitle,
  extractExcerpt,
};
