let currentUser = null;
let currentAuthMode = 'login';
let allAdminMedia = [];
let currentFilter = 'pending';

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  checkSession();
  loadTributes();
  loadApprovedMedia();
  setupUploadForm();
});

// Refresh lucide icons whenever elements are modified
function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

// Session Check
async function checkSession() {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    currentUser = data.user;
    updateAuthUI();
  } catch (err) {
    currentUser = null;
    updateAuthUI();
  }
}

function updateAuthUI() {
  const authActions = document.getElementById('auth-actions');
  const uploadLoggedIn = document.getElementById('upload-logged-in');
  const uploadLoggedOut = document.getElementById('upload-logged-out');
  const adminBanner = document.getElementById('admin-banner');

  if (currentUser) {
    authActions.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span style="font-size:0.85rem; color:#cbd5e1;">👤 ${escapeHtml(currentUser.name)} ${currentUser.role === 'admin' ? '<span class="status-tag status-approved">Admin</span>' : ''}</span>
        <button onclick="logout()" class="btn btn-outline btn-sm">Logout</button>
      </div>
    `;
    uploadLoggedIn.classList.remove('hidden');
    uploadLoggedOut.classList.add('hidden');

    if (currentUser.role === 'admin') {
      adminBanner.classList.remove('hidden');
      loadAdminUploads();
    } else {
      adminBanner.classList.add('hidden');
    }
  } else {
    authActions.innerHTML = `<button onclick="openModal('auth-modal')" class="btn btn-outline">Sign In / Register</button>`;
    uploadLoggedIn.classList.add('hidden');
    uploadLoggedOut.classList.remove('hidden');
    adminBanner.classList.add('hidden');
  }
  refreshIcons();
}

// Modal controls
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.getElementById('auth-error').classList.add('hidden');
}

function switchAuthMode(mode) {
  currentAuthMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const nameGroup = document.getElementById('name-group');
  const modalTitle = document.getElementById('auth-modal-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const adminHint = document.getElementById('admin-hint');

  if (mode === 'register') {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    nameGroup.style.display = 'flex';
    modalTitle.textContent = 'Create Account to Upload';
    submitBtn.textContent = 'Create Account';
    adminHint.style.display = 'none';
  } else {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    nameGroup.style.display = 'none';
    modalTitle.textContent = 'Sign In';
    submitBtn.textContent = 'Sign In';
    adminHint.style.display = 'block';
  }
}

// Handle Login / Register
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value;
  const errorBox = document.getElementById('auth-error');
  errorBox.classList.add('hidden');

  const endpoint = currentAuthMode === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = currentAuthMode === 'register' ? { name, email, password } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.error || 'Authentication failed';
      errorBox.classList.remove('hidden');
      return;
    }
    currentUser = data.user;
    closeModal('auth-modal');
    updateAuthUI();
  } catch (err) {
    errorBox.textContent = 'Network or server error';
    errorBox.classList.remove('hidden');
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
  document.getElementById('admin-section').classList.add('hidden');
}

// File Preview & Upload
function previewFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const previewArea = document.getElementById('file-preview-area');
  const previewContainer = document.getElementById('media-preview-container');
  const nameLabel = document.getElementById('file-name-label');
  const dropLabel = document.getElementById('dropzone-label');

  previewArea.classList.remove('hidden');
  nameLabel.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  dropLabel.textContent = 'Change selected file';

  const isVideo = file.type.startsWith('video');
  const objectUrl = URL.createObjectURL(file);

  if (isVideo) {
    previewContainer.innerHTML = `<video src="${objectUrl}" controls style="max-height: 220px; border-radius: 8px;"></video>`;
  } else {
    previewContainer.innerHTML = `<img src="${objectUrl}" alt="Preview" style="max-height: 220px; border-radius: 8px;">`;
  }
}

function setupUploadForm() {
  const form = document.getElementById('media-upload-form');
  const statusBox = document.getElementById('upload-status');
  const uploadBtn = document.getElementById('upload-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input');
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('media', fileInput.files[0]);
    formData.append('caption', document.getElementById('media-caption').value);

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = 'Uploading...';
    statusBox.classList.add('hidden');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload error');
      }

      statusBox.className = 'alert alert-success';
      statusBox.textContent = data.message;
      statusBox.classList.remove('hidden');

      form.reset();
      document.getElementById('file-preview-area').classList.add('hidden');
      document.getElementById('dropzone-label').textContent = 'Click or drag & drop photo or video here';

      if (currentUser && currentUser.role === 'admin') {
        loadAdminUploads();
        loadApprovedMedia();
      }
    } catch (err) {
      statusBox.className = 'alert alert-error';
      statusBox.textContent = err.message;
      statusBox.classList.remove('hidden');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<i data-lucide="cloud-upload"></i> Upload Media';
      refreshIcons();
    }
  });
}

// Load Approved Media for public gallery
async function loadApprovedMedia() {
  try {
    const res = await fetch('/api/media/approved');
    const items = await res.json();
    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('gallery-empty');

    if (!items || items.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = items.map(item => {
      const isVideo = item.mimetype.startsWith('video');
      const mediaHtml = isVideo
        ? `<video controls src="/upload/${escapeHtml(item.filename)}"></video>`
        : `<img loading="lazy" src="/upload/${escapeHtml(item.filename)}" alt="${escapeHtml(item.caption || 'Memorial media')}">`;

      return `
        <div class="gallery-card">
          <div class="gallery-media-wrapper">${mediaHtml}</div>
          <div class="gallery-info">
            ${item.caption ? `<p class="gallery-caption">"${escapeHtml(item.caption)}"</p>` : ''}
            <div class="gallery-meta">
              <span>By ${escapeHtml(item.user_name || 'Loved One')}</span>
              <span>${formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    refreshIcons();
  } catch (err) {
    console.error('Failed to load media', err);
  }
}

// Tribute Wall
async function loadTributes() {
  try {
    const res = await fetch('/api/tributes');
    const tributes = await res.json();
    const list = document.getElementById('tributes-list');
    const countBadge = document.getElementById('tribute-count');

    countBadge.textContent = `${tributes.length} ${tributes.length === 1 ? 'Tribute' : 'Tributes'}`;

    if (!tributes.length) {
      list.innerHTML = `<div class="empty-state"><p>No tributes left yet. Be the first to share your prayers and memories.</p></div>`;
      return;
    }

    list.innerHTML = tributes.map(t => `
      <div class="tribute-item">
        <div class="tribute-item-head">
          <div>
            <span class="tribute-author">${escapeHtml(t.author_name)}</span>
            ${t.relationship ? `<span class="tribute-relation">• ${escapeHtml(t.relationship)}</span>` : ''}
          </div>
          <span class="tribute-time">${formatDate(t.created_at)}</span>
        </div>
        <div class="tribute-body">${escapeHtml(t.message).replace(/\n/g, '<br>')}</div>
        ${t.candle_lit ? `<div class="candle-tag">🕯️ Lit a memorial candle</div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load tributes', err);
  }
}

async function submitTribute(e) {
  e.preventDefault();
  const author_name = document.getElementById('tribute-name').value;
  const relationship = document.getElementById('tribute-relationship').value;
  const message = document.getElementById('tribute-message').value;
  const candle_lit = document.getElementById('tribute-candle').checked;
  const alertBox = document.getElementById('tribute-alert');

  try {
    const res = await fetch('/api/tributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name, relationship, message, candle_lit })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit tribute');

    alertBox.className = 'alert alert-success';
    alertBox.textContent = 'Your tribute has been placed on Christiona\'s memorial wall.';
    alertBox.classList.remove('hidden');

    document.getElementById('tribute-form').reset();
    document.getElementById('tribute-candle').checked = true;
    loadTributes();

    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  } catch (err) {
    alertBox.className = 'alert alert-error';
    alertBox.textContent = err.message;
    alertBox.classList.remove('hidden');
  }
}

// Admin Panel
function toggleAdminPanel() {
  const panel = document.getElementById('admin-section');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    loadAdminUploads();
  }
}

async function loadAdminUploads() {
  try {
    const res = await fetch('/api/admin/uploads');
    allAdminMedia = await res.json();
    
    const pendingCount = allAdminMedia.filter(m => m.status === 'pending').length;
    document.getElementById('pending-count').textContent = pendingCount;
    renderAdminGrid();
  } catch (err) {
    console.error('Failed to load admin items', err);
  }
}

function filterAdminMedia(status) {
  currentFilter = status;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderAdminGrid();
}

function renderAdminGrid() {
  const grid = document.getElementById('admin-media-grid');
  const items = currentFilter === 'all' 
    ? allAdminMedia 
    : allAdminMedia.filter(m => m.status === currentFilter);

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No items found in category '${currentFilter}'.</p></div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const isVideo = item.mimetype.startsWith('video');
    const mediaPreview = isVideo
      ? `<video controls src="/upload/${escapeHtml(item.filename)}"></video>`
      : `<img src="/upload/${escapeHtml(item.filename)}" alt="Admin review">`;

    return `
      <div class="admin-card">
        <div class="admin-card-media">${mediaPreview}</div>
        <div class="admin-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="status-tag status-${item.status}">${item.status.toUpperCase()}</span>
            <small style="color:var(--text-muted);">${formatDate(item.created_at)}</small>
          </div>
          <p style="font-size:0.85rem; color:#cbd5e1;"><strong>Uploader:</strong> ${escapeHtml(item.user_name || 'User')}</p>
          <p style="font-size:0.85rem; color:#cbd5e1;"><strong>File:</strong> <code>${escapeHtml(item.filename)}</code></p>
          ${item.caption ? `<p style="font-size:0.85rem; font-style:italic;">"${escapeHtml(item.caption)}"</p>` : ''}
          <div class="admin-card-actions">
            ${item.status !== 'approved' ? `<button onclick="approveMedia('${item.id}')" class="btn btn-sm btn-success">Approve & Publish</button>` : ''}
            ${item.status !== 'rejected' ? `<button onclick="rejectMedia('${item.id}')" class="btn btn-sm btn-danger">Reject</button>` : ''}
            <button onclick="deleteMedia('${item.id}')" class="btn btn-sm btn-outline">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  refreshIcons();
}

async function approveMedia(id) {
  await fetch(`/api/admin/uploads/${id}/approve`, { method: 'POST' });
  await loadAdminUploads();
  loadApprovedMedia();
}

async function rejectMedia(id) {
  await fetch(`/api/admin/uploads/${id}/reject`, { method: 'POST' });
  await loadAdminUploads();
  loadApprovedMedia();
}

async function deleteMedia(id) {
  if (!confirm('Are you sure you want to permanently delete this file from the upload directory?')) return;
  await fetch(`/api/admin/uploads/${id}`, { method: 'DELETE' });
  await loadAdminUploads();
  loadApprovedMedia();
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}
