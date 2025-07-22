const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const db = admin.firestore();
    const doc = await db.collection('sessions').doc(sessionId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = doc.data();
    res.status(200).json({
      status: sessionData.status,
      progress: sessionData.progress || 0,
      videoUrl: sessionData.finalUrl || null,
      captions: sessionData.captions || null
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
});

module.exports = router;