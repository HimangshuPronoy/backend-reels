const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateCaption(videoDescription) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Create a 15-30 second viral TikTok caption for this gameplay clip: ${videoDescription}
  Style requirements:
  - Gen-Z humor with trending references
  - Maximum 2 short sentences
  - Include relevant emojis
  - Add hashtags like #gaming #viral`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate caption');
  }
}

module.exports = { generateCaption };