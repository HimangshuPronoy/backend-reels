const { ElevenLabsClient } = require('elevenlabs');
const { UTApi } = require('uploadthing/server');
require('dotenv').config();

const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Voice IDs for male/female voices
const VOICES = {
  male: 'TxGEqnHWrfWFTfGW9XjX',  // Josh voice
  female: '21m00Tcm4TlvDq8ikWAM' // Rachel voice
};

async function generateVoiceover(text, sessionId, gender = 'male') {
  try {
    // Select voice based on gender
    const voiceId = VOICES[gender.toLowerCase()] || VOICES.male;
    
    // Generate speech
    const audio = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: 'eleven_english_sts_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });
    
    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    // Upload to UploadThing
    const fileName = `voiceover-${sessionId}.mp3`;
    const upload = await utapi.uploadFiles(
      new File([audioBuffer], fileName, {
        type: 'audio/mpeg',
      })
    );

    if (!upload.data?.url) {
      throw new Error('Failed to upload audio to UploadThing');
    }

    return upload.data.url;
    
  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate voiceover');
  }
}

module.exports = { generateVoiceover };