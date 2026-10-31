const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const init = require('sql.js');
const { createUploadQueue } = require('../uploadQueue');
(async () => {
  const SQL = await init();
  const sql = new SQL.Database();
  const db = {
    async run(query, args = []) { sql.run(query, args); },
    async all(query, args = []) { const stmt = sql.prepare(query); stmt.bind(args); const rows = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows; },
    async get(query, args = []) { return (await this.all(query, args))[0]; }
  };
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'queue-test-'));
  const fixture = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
  try {
    await db.run('CREATE TABLE library (id TEXT PRIMARY KEY, title TEXT, filename TEXT, mimetype TEXT)');
    await db.run("CREATE TABLE upload_jobs (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', error TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    fs.writeFileSync(path.join(directory, 'recovered.webp'), fixture);
    await db.run('INSERT INTO upload_jobs (id, payload, status) VALUES (?, ?, ?)', ['recovered', JSON.stringify({ kind: 'library', title: 'Recovered', ids: ['recovered-item'], files: [{ filename: 'recovered.webp', originalname: 'recovered.webp', mimetype: 'image/webp' }] }), 'processing']);
    const queue = createUploadQueue(db, directory);
    fs.writeFileSync(path.join(directory, 'new.webp'), fixture);
    const id = await queue.enqueue({ kind: 'library', title: 'New', files: [{ filename: 'new.webp', originalname: 'new.webp', mimetype: 'image/webp' }] });
    const bad = await queue.enqueue({ kind: 'library', title: 'Missing', files: [{ filename: 'missing.webp', mimetype: 'image/webp' }] });
    async function waitFor(check) {
      for (let i = 0; i < 200; i++) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 50)); }
      throw Error('Queue timed out');
    }
    await waitFor(async () => (await queue.list()).every(job => ['done', 'failed'].includes(job.status)));
    assert.equal((await db.get('SELECT * FROM upload_jobs WHERE id = ?', [id])).status, 'done');
    assert.equal((await db.get("SELECT * FROM upload_jobs WHERE id = 'recovered'")).status, 'done');
    assert.equal((await db.get('SELECT * FROM upload_jobs WHERE id = ?', [bad])).status, 'failed');
    fs.writeFileSync(path.join(directory, 'missing.webp'), fixture);
    await queue.retry(bad);
    await waitFor(async () => (await db.get('SELECT * FROM upload_jobs WHERE id = ?', [bad])).status === 'done');
    assert.equal((await db.all('SELECT * FROM library')).length, 3);
    assert(!fs.existsSync(path.join(directory, 'new.webp')));
    console.log('PASS: concurrent receipt, interrupted job recovery, conversion, failure isolation, retry, cleanup');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
