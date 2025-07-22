const express = require('express');
const router = express.Router();
const { UTApi } = require('uploadthing/server');
const { v4: uuidv4 } = require('uuid');
const { generateCaption } = require('../utils/gemini');
const { generateVoiceover } = require('../utils/tts');
const { renderVideo } = require('../utils/renderer');

const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

async function processVideo(sessionId, videoUrl) {
  try {
    // Generate caption
    
    const caption = await generateCaption("Exciting gameplay clip");
    
    // Detect voice gender from caption content
    const gender = caption.toLowerCase().includes('girl') ||
                   caption.toLowerCase().includes('she') ||
                   caption.toLowerCase().includes('woman') ? 'female' : 'male';


    // Generate voiceover with detected gender
    const audioUrl = await generateVoiceover(caption, sessionId, gender);

    // Render final video
    const finalUrl = await renderVideo(sessionId, caption, audioUrl);

  } catch (error) {
    console.error(`Processing failed for ${sessionId}:`, error);
  }
}

router.post('/', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const videoUrl = req.body.videoUrl; // Expecting UploadThing URL from client

    // Start background processing
    processVideo(sessionId, req.body.videoUrl);

    res.status(200).json({
      sessionId,
      status: 'processing_started',
      message: 'Video processing initiated'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

module.exports = router;