const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Google Gemini Service
 * Handles all Google Generative AI (Gemini) interactions
 */

/**
 * Create an initialized Gemini client
 * @param {string} apiKey - Google API key
 * @returns {GoogleGenerativeAI} Initialized Gemini client
 */
function createGeminiClient(apiKey) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Test Gemini connection and get available models
 * @param {string} apiKey - Google API key
 * @returns {Promise<object>} { success, models, message }
 */
async function testConnection(apiKey) {
  try {
    const client = createGeminiClient(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    // Test with a simple generation to verify key works
    const result = await model.generateContent('Say "OK"');
    const response = await result.response;

    if (response.text()) {
      return {
        success: true,
        models: ['gemini-pro', 'gemini-pro-vision'],
        message: 'Gemini connection successful',
      };
    }
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return {
      success: false,
      models: [],
      message: `Connection failed: ${error.message}`,
    };
  }
}

/**
 * Generate content using Google Gemini
 * @param {object} config - Configuration object
 * @param {string} config.apiKey - Google API key
 * @param {string} config.model - Model to use (e.g., 'gemini-pro')
 * @param {string} config.prompt - The prompt for content generation
 * @param {number} config.temperature - Temperature (0-1), default 0.7
 * @param {number} config.maxTokens - Max tokens in response, default 2000
 * @returns {Promise<object>} { content, tokens, model, timestamp }
 */
async function generateContent(config) {
  const {
    apiKey,
    model = 'gemini-pro',
    prompt,
    temperature = 0.7,
    maxTokens = 2000,
  } = config;

  try {
    const client = createGeminiClient(apiKey);
    const geminiModel = client.getGenerativeModel({
      model: model,
    });

    console.log(`[Gemini] Generating with ${model}...`);

    const result = await geminiModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a professional content writer. Generate high-quality blog posts with proper markdown formatting.\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: Math.min(Math.max(temperature, 0), 1),
        maxOutputTokens: maxTokens,
      },
    });

    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No content generated');
    }

    // Gemini doesn't provide token count in basic API
    // Estimate: roughly 1 token per 4 characters
    const estimatedTokens = Math.ceil(content.length / 4);

    return {
      content,
      tokens: estimatedTokens,
      model: model,
      finishReason: response.candidates[0]?.finishReason,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Gemini generation failed:', error);
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
  createGeminiClient,
  testConnection,
  generateContent,
  extractTitle,
  extractExcerpt,
};
