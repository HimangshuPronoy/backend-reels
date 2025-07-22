const { createUploadthing } = require("@uploadthing/server");

const f = createUploadthing();

module.exports = {
  uploadRouter: f({
    video: {
      maxFileSize: "512MB",
      maxFileCount: 1,
      fileTypes: ["video/mp4", "video/quicktime"],
    },
    audio: {
      maxFileSize: "64MB",
      maxFileCount: 1,
      fileTypes: ["audio/mpeg"],
    }
  }).onUploadComplete((data) => {
    console.log("Upload completed:", data.file.url);
  }),
};