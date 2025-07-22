const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { UTApi } = require('uploadthing/server');
const FormData = require('form-data');
require('dotenv').config();

const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

async function downloadFile(url, filePath) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function renderVideo(sessionId, caption, audioUrl) {
  const tempDir = path.join(__dirname, '../temp', sessionId);
  const inputPath = path.join(tempDir, 'input.mp4');
  const audioPath = path.join(tempDir, 'audio.mp3');
  const outputPath = path.join(tempDir, 'output.mp4');
  
  // Create temp directory
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Download files from UploadThing
    await downloadFile(audioUrl, audioPath);
    
    // Get video URL from session data (passed from upload route)
    const db = admin.firestore();
    const session = await db.collection('sessions').doc(sessionId).get();
    const videoUrl = session.data().videoUrl;
    await downloadFile(videoUrl, inputPath);

    // Render video with FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-shortest',
          '-vf subtitles=force_style=\'Fontsize=24,Alignment=10\'',
          '-map_metadata -1'
        ])
        .complexFilter([
          `drawtext=text='${caption}': fontcolor=white: fontsize=24: box=1: boxcolor=black@0.5: boxborderw=5: x=(w-text_w)/2: y=h-th-50`
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Upload final video to UploadThing
    const form = new FormData();
    form.append('files', fs.createReadStream(outputPath), {
      filename: `final-${sessionId}.mp4`,
      contentType: 'video/mp4'
    });

    const upload = await utapi.uploadFiles(form);
    if (!upload.data?.url) {
      throw new Error('Failed to upload final video');
    }

    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });

    return upload.data.url;

  } catch (error) {
    // Cleanup on error
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw error;
  }
}

module.exports = { renderVideo };