const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'memorial-christiona-secret-key-2026';

// Setup directories
const UPLOAD_DIR = path.join(__dirname, 'upload');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|quicktime/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar dan video yang diperbolehkan'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/upload', express.static(UPLOAD_DIR));

// Create or update default admin user on boot
async function ensureAdmin() {
  const adminEmail = 'admin@christiona.memorial';
  const hashed = await bcrypt.hash('fractal1@a', 10);
  const existing = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    const adminId = crypto.randomUUID();
    await db.run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'Admin Family', adminEmail, hashed, 'admin']
    );
    console.log('Default admin created: admin@christiona.memorial / fractal1@a');
  } else {
    await db.run('UPDATE users SET password = ? WHERE email = ?', [hashed, adminEmail]);
    console.log('Admin password synchronized: fractal1@a');
  }
}
ensureAdmin();

// Helper to authenticate user from cookie or authorization header
async function getUser(req) {
  const token = req.cookies.auth_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    return user || null;
  } catch (err) {
    return null;
  }
}

// Auth Middleware
async function requireAuth(req, res, next) {
  const user = await getUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in or create an account to perform this action' });
  }
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  const user = await getUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.user = user;
  next();
}

// --- AUTH API ROUTES (Better Auth Compatible JSON endpoints) ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    await db.run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), cleanEmail, hashed, 'user']
    );

    const token = jwt.sign({ id: userId, email: cleanEmail }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ success: true, user: { id: userId, name: name.trim(), email: cleanEmail, role: 'user' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/session', async (req, res) => {
  const user = await getUser(req);
  res.json({ user });
});

// --- MEMORIAL WALL TRIBUTES ---
app.get('/api/tributes', async (req, res) => {
  try {
    const tributes = await db.all('SELECT * FROM tributes ORDER BY created_at DESC');
    res.json(tributes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tributes' });
  }
});

app.post('/api/tributes', async (req, res) => {
  try {
    const { author_name, relationship, message, candle_lit } = req.body;
    if (!author_name || !message) {
      return res.status(400).json({ error: 'Please include your name and message' });
    }
    const id = crypto.randomUUID();
    await db.run(
      'INSERT INTO tributes (id, author_name, relationship, message, candle_lit) VALUES (?, ?, ?, ?, ?)',
      [id, author_name.trim(), relationship || 'Friend / Family', message.trim(), candle_lit ? 1 : 0]
    );
    res.json({ success: true, tribute: { id, author_name, relationship, message } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post tribute' });
  }
});

// --- MULTI-FILE UPLOADS (Images and Videos Only) ---
// Open for ANYONE (no login required). Stored in upload/ and defaults to 'pending' until approved by admin.
app.post('/api/upload', upload.array('media', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const caption = (req.body.caption || '').trim();
    const uploaderName = (req.body.uploader_name || '').trim();

    if (!files.length) {
      return res.status(400).json({ error: 'Silakan pilih setidaknya satu foto atau video untuk diunggah.' });
    }

    // Enforce 10MB total batch upload limit
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10MB total
    if (totalBytes > MAX_TOTAL_BYTES) {
      for (const file of files) {
        try { fs.unlinkSync(path.join(UPLOAD_DIR, file.filename)); } catch (e) {}
      }
      return res.status(400).json({ error: 'Total ukuran seluruh file melebihi batas 10 MB. Silakan kurangi file atau gunakan ukuran yang lebih kecil.' });
    }

    // Check if uploader happens to be an authenticated admin
    const currentUser = await getUser(req);
    const isAdmin = currentUser && currentUser.role === 'admin';
    const status = isAdmin ? 'approved' : 'pending';

    const displayName = uploaderName || (currentUser ? currentUser.name : 'Keluarga & Kerabat');
    const userId = currentUser ? currentUser.id : 'guest';
    const postId = crypto.randomUUID();

    for (const file of files) {
      const id = crypto.randomUUID();
      await db.run(
        'INSERT INTO uploads (id, post_id, user_id, user_name, filename, original_name, mimetype, size, caption, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, postId, userId, displayName, file.filename, file.originalname, file.mimetype, file.size, caption, status]
      );
    }

    const countText = files.length === 1 ? '1 file' : `${files.length} file`;
    res.json({
      success: true,
      postId: postId,
      count: files.length,
      status: status,
      message: status === 'approved' 
        ? `${countText} berhasil diunggah dan langsung dipublikasikan!` 
        : `Unggahan berhasil dikirim! Foto dan video Anda sedang ditinjau oleh pihak keluarga/admin dan akan segera ditampilkan setelah disetujui.`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Gagal mengunggah file' });
  }
});

// Like / Heart a post
app.post('/api/media/:id/like', async (req, res) => {
  try {
    await db.run("UPDATE uploads SET likes = COALESCE(likes, 0) + 1 WHERE id = ?", [req.params.id]);
    const updated = await db.get("SELECT likes FROM uploads WHERE id = ?", [req.params.id]);
    res.json({ success: true, likes: updated ? updated.likes : 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Get approved uploads for public gallery
app.get('/api/media/approved', async (req, res) => {
  try {
    const list = await db.all("SELECT * FROM uploads WHERE status = 'approved' ORDER BY created_at DESC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data media' });
  }
});

// --- ADMIN MODERATION ENDPOINTS ---

// 1. Grouped by POST (for approving per post instead of per image)
app.get('/api/admin/posts', requireAdmin, async (req, res) => {
  try {
    const allUploads = await db.all("SELECT * FROM uploads ORDER BY created_at DESC");
    const postsMap = new Map();

    for (const item of allUploads) {
      const pid = item.post_id || item.id;
      if (!postsMap.has(pid)) {
        postsMap.set(pid, {
          id: pid,
          post_id: pid,
          user_id: item.user_id,
          user_name: item.user_name,
          caption: item.caption,
          status: item.status,
          created_at: item.created_at,
          likes: item.likes || 0,
          media: []
        });
      }
      postsMap.get(pid).media.push(item);
    }

    res.json(Array.from(postsMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat daftar kiriman admin' });
  }
});

// Approve entire post (all images/videos under this post_id)
app.post('/api/admin/posts/:postId/approve', requireAdmin, async (req, res) => {
  try {
    const pid = req.params.postId;
    await db.run("UPDATE uploads SET status = 'approved' WHERE post_id = ? OR id = ?", [pid, pid]);
    res.json({ success: true, message: 'Postingan berhasil disetujui dan dipublikasikan ke feed!' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyetujui postingan' });
  }
});

// Reject entire post
app.post('/api/admin/posts/:postId/reject', requireAdmin, async (req, res) => {
  try {
    const pid = req.params.postId;
    await db.run("UPDATE uploads SET status = 'rejected' WHERE post_id = ? OR id = ?", [pid, pid]);
    res.json({ success: true, message: 'Postingan telah ditolak' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menolak postingan' });
  }
});

// Delete entire post (and remove all associated files from disk)
app.delete('/api/admin/posts/:postId', requireAdmin, async (req, res) => {
  try {
    const pid = req.params.postId;
    const items = await db.all('SELECT * FROM uploads WHERE post_id = ? OR id = ?', [pid, pid]);
    for (const item of items) {
      const filePath = path.join(UPLOAD_DIR, item.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }
    await db.run('DELETE FROM uploads WHERE post_id = ? OR id = ?', [pid, pid]);
    res.json({ success: true, message: 'Postingan berhasil dihapus permanen' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus postingan' });
  }
});

// Legacy single-item endpoints (kept for compatibility)
app.get('/api/admin/uploads', requireAdmin, async (req, res) => {
  try {
    const list = await db.all("SELECT * FROM uploads ORDER BY created_at DESC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat daftar unggahan' });
  }
});

app.post('/api/admin/uploads/:id/approve', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE uploads SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Media disetujui' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyetujui media' });
  }
});

app.post('/api/admin/uploads/:id/reject', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE uploads SET status = 'rejected' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Media ditolak' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menolak media' });
  }
});

app.delete('/api/admin/uploads/:id', requireAdmin, async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM uploads WHERE id = ?', [req.params.id]);
    if (item) {
      const filePath = path.join(UPLOAD_DIR, item.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      await db.run('DELETE FROM uploads WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true, message: 'Media berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus media' });
  }
});

// Vue app (built with `npm run build`) - SPA fallback for client-side routes like /admin
const DIST_DIR = path.join(__dirname, 'dist');
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/upload')) {
    const indexFile = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexFile)) {
      return res.status(503).send('Frontend not built yet. Run: npm run build');
    }
    return res.sendFile(indexFile);
  }
  next();
});

// JSON error handler (multer limits, bad file types, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file melebihi batas maksimal (10 MB).' : err.message;
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: msg });
  }
  console.error(err);
  res.status(err.status || 400).json({ error: err.message || 'Terjadi kesalahan sistem' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Memorial server is running on http://0.0.0.0:${PORT}`);
});
// Extend HTTP timeouts to support heavy mobile video uploads without premature disconnects
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.requestTimeout = 600000; // 10 minutes timeout for large files
