const express = require('express');
const router = express.Router();

router.get('/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    // TODO: Replace with proper database implementation
    // For demo purposes, return completed status for any valid UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json({
      status: 'completed',
      progress: 100,
      videoUrl: `https://example.com/videos/${sessionId}.mp4`,
      captions: 'Exciting gameplay moment!'
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
});

module.exports = router;