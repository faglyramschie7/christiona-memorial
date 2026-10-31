const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

/**
 * Converts an uploaded image to WebP or video to WebM.
 * Updates file.filename, file.mimetype, and file.size in-place.
 * 
 * @param {Object} file - Multer file object
 * @param {string} uploadDir - Absolute path to uploads directory
 * @returns {Promise<Object>} Updated file object
 */
async function convertUploadedFile(file, uploadDir) {
  const originalExt = path.extname(file.filename).toLowerCase();
  const baseName = path.parse(file.filename).name;
  const inputPath = path.join(uploadDir, file.filename);

  const isImage = (file.mimetype && file.mimetype.startsWith('image/')) ||
    /\.(jpe?g|png|webp|gif|bmp|heic|tiff?)$/i.test(file.originalname || file.filename);

  const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
    /\.(mp4|webm|mov|m4v|mkv|avi|3gp|wmv)$/i.test(file.originalname || file.filename);

  if (isImage) {
    // If already webp, nothing to do
    if (originalExt === '.webp' && file.mimetype === 'image/webp') {
      return file;
    }

    const targetFilename = `${baseName}.webp`;
    const outputPath = path.join(uploadDir, targetFilename);

    let converted = false;
    // 1. Try cwebp
    try {
      await execFilePromise('cwebp', ['-q', '82', inputPath, '-o', outputPath]);
      converted = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
    } catch (cwebpErr) {
      console.warn(`[mediaConverter] cwebp failed on ${file.filename}: ${cwebpErr.message}. Trying ffmpeg...`);
    }

    // 2. Fallback to ffmpeg libwebp
    if (!converted) {
      try {
        await execFilePromise('ffmpeg', [
          '-y',
          '-i', inputPath,
          '-c:v', 'libwebp',
          '-quality', '82',
          outputPath
        ]);
        converted = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
      } catch (ffmpegErr) {
        console.error(`[mediaConverter] ffmpeg libwebp also failed on ${file.filename}: ${ffmpegErr.message}`);
      }
    }

    if (converted) {
      if (inputPath !== outputPath && fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch (e) {}
      }
      file.filename = targetFilename;
      file.mimetype = 'image/webp';
      file.size = fs.statSync(outputPath).size;
      console.log(`[mediaConverter] Converted image ${file.originalname} -> ${targetFilename} (${file.size} bytes)`);
    }
    return file;
  }

  if (isVideo) {
    // If already webm, nothing to do
    if (originalExt === '.webm' && file.mimetype === 'video/webm') {
      return file;
    }

    const targetFilename = `${baseName}.webm`;
    const outputPath = path.join(uploadDir, targetFilename);

    let converted = false;
    // 1. Try hardware-accelerated vp8_mediacodec
    try {
      await execFilePromise('ffmpeg', [
        '-y',
        '-i', inputPath,
        '-c:v', 'vp8_mediacodec',
        '-b:v', '1500k',
        '-c:a', 'libopus',
        '-b:a', '96k',
        outputPath
      ]);
      converted = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
    } catch (hwErr) {
      console.warn(`[mediaConverter] vp8_mediacodec failed on ${file.filename}: ${hwErr.message}. Trying libvpx fallback...`);
    }

    // 2. Fallback to software libvpx realtime
    if (!converted) {
      try {
        await execFilePromise('ffmpeg', [
          '-y',
          '-i', inputPath,
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-c:v', 'libvpx',
          '-quality', 'realtime',
          '-cpu-used', '8',
          '-threads', '4',
          '-b:v', '1500k',
          '-c:a', 'libopus',
          '-b:a', '96k',
          outputPath
        ]);
        converted = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
      } catch (swErr) {
        console.error(`[mediaConverter] libvpx fallback also failed on ${file.filename}: ${swErr.message}`);
      }
    }

    if (converted) {
      if (inputPath !== outputPath && fs.existsSync(inputPath)) {
        try { fs.unlinkSync(inputPath); } catch (e) {}
      }
      file.filename = targetFilename;
      file.mimetype = 'video/webm';
      file.size = fs.statSync(outputPath).size;
      console.log(`[mediaConverter] Converted video ${file.originalname} -> ${targetFilename} (${file.size} bytes)`);
    }
    return file;
  }

  return file;
}

module.exports = {
  convertUploadedFile
};
