const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSDK() {
  console.log('--- Anthropic ---');
  try {
    const anthropic = new Anthropic({ apiKey: 'test' });
    console.log('models.list available:', typeof anthropic.models?.list);
  } catch (e) {
    console.log('Anthropic check failed:', e.message);
  }

  console.log('--- Gemini ---');
  try {
    const genAI = new GoogleGenerativeAI('test');
    // For Gemini, listing models often requires a fetch or a specific method
    console.log('listModels available:', typeof genAI.listModels);
    // In some versions it's on a different namespace or not available without extra steps
  } catch (e) {
    console.log('Gemini check failed:', e.message);
  }
}

testSDK();
