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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video/image
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|quicktime/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and video files are permitted'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(UPLOAD_DIR));

// Create default admin user on boot
async function ensureAdmin() {
  const adminEmail = 'admin@christiona.memorial';
  const existing = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10);
    const adminId = crypto.randomUUID();
    await db.run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, 'Admin Family', adminEmail, hashed, 'admin']
    );
    console.log('Default admin created: admin@christiona.memorial / admin123');
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

// --- MEDIA UPLOADS ---
// Open for any logged-in user:
app.post('/api/upload', requireAuth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image or video file' });
    }
    const id = crypto.randomUUID();
    const caption = req.body.caption || '';
    
    // Status defaults to 'pending' unless uploader is admin
    const status = req.user.role === 'admin' ? 'approved' : 'pending';

    await db.run(
      'INSERT INTO uploads (id, user_id, user_name, filename, original_name, mimetype, size, caption, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, req.user.name, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, caption, status]
    );

    res.json({
      success: true,
      status: status,
      message: status === 'approved' 
        ? 'Media uploaded and published!' 
        : 'Media uploaded successfully! It is in the upload folder and awaiting admin approval before being displayed on the public gallery.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Get approved uploads for public gallery
app.get('/api/media/approved', async (req, res) => {
  try {
    const list = await db.all("SELECT * FROM uploads WHERE status = 'approved' ORDER BY created_at DESC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve media' });
  }
});

// --- ADMIN MODERATION ENDPOINTS ---
app.get('/api/admin/uploads', requireAdmin, async (req, res) => {
  try {
    const list = await db.all("SELECT * FROM uploads ORDER BY created_at DESC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin list' });
  }
});

app.post('/api/admin/uploads/:id/approve', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE uploads SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Media approved and published' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve media' });
  }
});

app.post('/api/admin/uploads/:id/reject', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE uploads SET status = 'rejected' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Media rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject media' });
  }
});

app.delete('/api/admin/uploads/:id', requireAdmin, async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM uploads WHERE id = ?', [req.params.id]);
    if (item) {
      const filePath = path.join(UPLOAD_DIR, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.run('DELETE FROM uploads WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true, message: 'Media removed permanently' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Fallback to index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/upload')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Memorial server is running on http://0.0.0.0:${PORT}`);
});
