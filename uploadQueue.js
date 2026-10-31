const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { convertUploadedFile } = require('./mediaConverter');

function createUploadQueue(db, root) {
  let running = false;
  const ready = db.run(`CREATE TABLE IF NOT EXISTS upload_jobs (
    id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
    error TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).then(() => db.run("UPDATE upload_jobs SET status = 'queued' WHERE status = 'processing'"));
  async function enqueue(payload) {
    await ready;
    const id = crypto.randomUUID();
    payload.ids = payload.files.map(() => crypto.randomUUID());
    await db.run('INSERT INTO upload_jobs (id, payload) VALUES (?, ?)', [id, JSON.stringify(payload)]);
    setImmediate(work);
    return id;
  }
  async function work() {
    if (running) return;
    running = true;
    try {
      await ready;
      let job;
      while ((job = await db.get("SELECT * FROM upload_jobs WHERE status = 'queued' ORDER BY created_at, rowid LIMIT 1"))) {
        await db.run("UPDATE upload_jobs SET status = 'processing', error = NULL WHERE id = ?", [job.id]);
        const payload = JSON.parse(job.payload);
        try {
          const converted = [];
          for (let i = 0; i < payload.files.length; i++) {
            const original = payload.files[i];
            const directory = path.join(root, payload.kind === 'music' ? 'music' : '');
            const file = { ...original, filename: `${job.id}-${i}${path.extname(original.filename)}` };
            fs.copyFileSync(path.join(directory, original.filename), path.join(directory, file.filename));
            await convertUploadedFile(file, directory);
            converted.push(file);
          }
          // Publish only after all files have been converted. IDs make restart retries idempotent.
          for (let i = 0; i < converted.length; i++) {
            const file = converted[i], id = payload.ids[i];
            if (payload.kind === 'feed') await db.run('INSERT OR REPLACE INTO uploads (id, post_id, user_id, user_name, filename, original_name, mimetype, size, caption, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, payload.postId, payload.userId, payload.displayName, file.filename, file.originalname, file.mimetype, file.size, payload.caption, 'processing']);
            if (payload.kind === 'library') await db.run('INSERT OR REPLACE INTO library (id, title, filename, mimetype) VALUES (?, ?, ?, ?)', [id, payload.title, file.filename, file.mimetype]);
            if (payload.kind === 'music') await db.run('INSERT OR REPLACE INTO songs (id, title, src) VALUES (?, ?, ?)', [id, payload.title, '/upload/music/' + file.filename]);
          }
          if (payload.kind === 'feed') {
            await db.run('UPDATE uploads SET status = ? WHERE post_id = ? AND status = ?', [payload.status, payload.postId, 'processing']);
          }
          await db.run("UPDATE upload_jobs SET status = 'done' WHERE id = ?", [job.id]);
          for (const file of payload.files) {
            try { fs.unlinkSync(path.join(root, payload.kind === 'music' ? 'music' : '', file.filename)); } catch {}
          }
        } catch (error) {
          await db.run("UPDATE upload_jobs SET status = 'failed', error = ? WHERE id = ?", [error.message, job.id]);
        }
      }
    } catch (error) { console.error('Upload queue:', error.message); }
    finally { running = false; }
  }
  async function list() {
    await ready;
    const jobs = await db.all("SELECT * FROM upload_jobs ORDER BY created_at DESC LIMIT 50");
    return jobs.map(({ payload, ...job }) => { const data = JSON.parse(payload); return { ...job, kind: data.kind, title: data.title || data.caption || data.displayName }; });
  }
  async function retry(id) {
    await ready;
    await db.run("UPDATE upload_jobs SET status = 'queued', error = NULL WHERE id = ? AND status = 'failed'", [id]);
    setImmediate(work);
  }
  const timer = setInterval(work, 5000);
  timer.unref();
  return { enqueue, list, retry, start: work };
}
module.exports = { createUploadQueue };
