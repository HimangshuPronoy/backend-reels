require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createRouteHandler } = require('uploadthing/express');
const { uploadRouter } = require('./uploadthing.config');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// UploadThing routes
app.use(
  '/api/uploadthing',
  createRouteHandler({
    router: uploadRouter,
    config: {
      uploadthingSecret: process.env.UPLOADTHING_SECRET,
      uploadthingId: process.env.UPLOADTHING_APP_ID,
    },
  })
);

// Application routes
const uploadRoutes = require('./routes/upload');
const statusRoutes = require('./routes/status');
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});