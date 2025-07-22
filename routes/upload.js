const express = require('express');
const router = express.Router();
const { UTApi } = require('uploadthing/server');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const { generateCaption } = require('../utils/gemini');
const { generateVoiceover } = require('../utils/tts');
const { renderVideo } = require('../utils/renderer');

const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

async function processVideo(sessionId, videoUrl) {
  const db = admin.firestore();
  const sessionRef = db.collection('sessions').doc(sessionId);
  
  try {
    // Generate caption
    await sessionRef.update({
      status: 'processing',
      progress: 25,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const caption = await generateCaption("Exciting gameplay clip");
    
    // Detect voice gender from caption content
    const gender = caption.toLowerCase().includes('girl') ||
                   caption.toLowerCase().includes('she') ||
                   caption.toLowerCase().includes('woman') ? 'female' : 'male';

    await sessionRef.update({
      status: 'caption_generated',
      progress: 40,
      captions: caption,
      voiceGender: gender,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate voiceover with detected gender
    const audioUrl = await generateVoiceover(caption, sessionId, gender);
    await sessionRef.update({
      status: 'audio_generated',
      progress: 60,
      audioUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Render final video
    const finalUrl = await renderVideo(sessionId, caption, audioUrl);
    await sessionRef.update({
      status: 'completed',
      progress: 100,
      finalUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error(`Processing failed for ${sessionId}:`, error);
    await sessionRef.update({
      status: 'failed',
      error: error.message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

router.post('/', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const videoUrl = req.body.videoUrl; // Expecting UploadThing URL from client

    // Create Firestore document
    const db = admin.firestore();
    await db.collection('sessions').doc(sessionId).set({
      status: 'uploaded',
      videoUrl,
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Start background processing
    processVideo(sessionId, videoUrl);

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