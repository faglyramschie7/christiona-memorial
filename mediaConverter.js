const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const run = promisify(execFile);

// Serialize encoding so simultaneous uploads do not compete for CPU and memory.
let queue = Promise.resolve();
async function convert(file, directory) {
  const type = file.mimetype || '';
  const image = type.startsWith('image/');
  const video = type.startsWith('video/');
  const audio = type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(file.originalname || '');
  if (!image && !video && !audio) throw new Error('Format media tidak didukung.');
  const filename = `${path.parse(file.filename).name}-optimized.${image ? 'webp' : 'webm'}`;
  const input = path.join(directory, file.filename);
  const output = path.join(directory, filename);
  const options = { timeout: 20 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 };
  try {
    if (image) {
      try {
        await run('cwebp', ['-quiet', '-q', '80', input, '-o', output], options);
      } catch {
        await run('ffmpeg', ['-y', '-threads', '2', '-i', input, '-vf', "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease", '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80', output], options);
      }
    } else {
      const args = ['-y', '-threads', '2', '-i', input, '-map_metadata', '-1'];
      if (video) args.push('-map', '0:v:0', '-map', '0:a:0?', '-vf', "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2", '-r', '30', '-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-threads', '2', '-b:v', '1200k');
      else args.push('-vn', '-map', '0:a:0');
      args.push('-c:a', 'libopus', '-b:a', '96k', '-ac', '2', output);
      await run('ffmpeg', args, options);
    }
    if (!fs.existsSync(output) || !fs.statSync(output).size) throw new Error('Empty output');
    fs.unlinkSync(input);
    file.filename = filename;
    file.path = output;
    file.mimetype = image ? 'image/webp' : video ? 'video/webm' : 'audio/webm';
    file.size = fs.statSync(output).size;
    return file;
  } catch (error) {
    for (const target of [input, output]) { try { fs.unlinkSync(target); } catch {} }
    console.error('[mediaConverter]', error.code || error.message);
    throw new Error('Media gagal dioptimalkan. Pastikan FFmpeg tersedia di server, lalu coba lagi.');
  }
}
function convertUploadedFile(file, directory) {
  const task = queue.then(() => convert(file, directory));
  queue = task.catch(() => {});
  return task;
}
module.exports = { convertUploadedFile };

function rotateUploadedFile(file, directory, degrees) {
  const task = queue.then(async () => {
    const image = file.mimetype.startsWith('image/');
    const filename = `${require('crypto').randomUUID()}.${image ? 'webp' : 'webm'}`;
    const output = path.join(directory, filename);
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-filter_threads', '1', '-threads', '1', '-i', path.join(directory, file.filename), '-vf', degrees === 90 ? 'transpose=1' : 'transpose=2'];
    if (image) args.push('-frames:v', '1', '-c:v', 'libwebp', '-quality', '80');
    else args.push('-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-threads', '1', '-b:v', '1200k', '-c:a', 'libopus', '-b:a', '96k');
    try {
      const options = { timeout: 20 * 60 * 1000, maxBuffer: 2 * 1024 * 1024 };
      if (image) {
        const intermediate = output + '.png';
        try {
          const imageArgs = args.slice(0, args.indexOf('-frames:v'));
          await run('ffmpeg', [...imageArgs, '-frames:v', '1', intermediate], options);
          try { await run('cwebp', ['-quiet', '-q', '80', intermediate, '-o', output], options); }
          catch { await run('ffmpeg', [...args, output], options); }
        } finally { try { fs.unlinkSync(intermediate); } catch {} }
      } else await run('ffmpeg', [...args, output], options);
      return { filename, mimetype: image ? 'image/webp' : 'video/webm', size: fs.statSync(output).size };
    } catch (error) {
      try { fs.unlinkSync(output); } catch {}
      console.error('[mediaRotation]', { file: file.filename, code: error.code, signal: error.signal, stderr: error.stderr, message: error.message });
      if (error.code === 'ENOENT') throw new Error('FFmpeg tidak ditemukan oleh aplikasi. Instal FFmpeg lalu restart aplikasi.');
      if (!fs.existsSync(path.join(directory, file.filename))) throw new Error('File asli tidak ditemukan di server.');
      if (error.killed) throw new Error('Rotasi melewati batas waktu. Silakan coba lagi.');
      throw new Error('Rotasi gagal. Lihat detail [mediaRotation] di log server.');
    }
  });
  queue = task.catch(() => {});
  return task;
}
module.exports.rotateUploadedFile = rotateUploadedFile;
