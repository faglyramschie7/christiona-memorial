async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...options });
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON body */ }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

function uploadWithProgress(url, body) {
  const id = crypto.randomUUID();
  const title = body.get('title') || body.get('song')?.name || 'Media';
  const report = (percent, active = true) => window.dispatchEvent(new CustomEvent('admin-upload-progress', { detail: { id, title, percent, active, kind: url.includes('/library') ? 'library' : 'music' } }));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = event => { if (event.lengthComputable) report(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      report(100, false);
      let data;
      try { data = JSON.parse(xhr.responseText); } catch {
        const messages = {
          413: 'Unggahan ditolak server karena terlalu besar. Batas proxy server perlu disesuaikan.',
          502: 'Server unggahan tidak tersedia. Silakan coba lagi.',
          504: 'Waktu unggahan habis di server. Silakan coba lagi.'
        };
        reject(new Error(messages[xhr.status] || `Server mengembalikan respons yang tidak dapat dibaca (HTTP ${xhr.status}).`)); return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `Upload gagal (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => { report(0, false); reject(new Error('Koneksi terputus. Silakan coba lagi.')); };
    xhr.onabort = () => { report(0, false); reject(new Error('Unggahan dibatalkan.')); };
    report(0);
    xhr.send(body);
  });
}

export const api = {
  session: () => request('/api/auth/session'),
  login: (b) => request('/api/auth/login', json('POST', b)),
  register: (b) => request('/api/auth/register', json('POST', b)),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  tributes: () => request('/api/tributes'),
  postTribute: (b) => request('/api/tributes', json('POST', b)),

  uploadJobs: () => request('/api/admin/upload-jobs'),
  retryUploadJob: (id) => request(`/api/admin/upload-jobs/${id}/retry`, { method: 'POST' }),
  library: () => request('/api/slideshow/library'),
  uploadLibrary: (body) => uploadWithProgress('/api/admin/library', body),
  removeLibrary: (id) => request(`/api/admin/library/${id}`, { method: 'DELETE' }),
  slideshowMusic: () => request('/api/slideshow/music'),
  uploadSong: (body) => uploadWithProgress('/api/admin/slideshow/music', body),
  selectSong: (selectedId) => request('/api/admin/slideshow/music', json('PUT', { selectedId })),
  slideshowSettings: () => request('/api/slideshow/settings'),
  saveSlideshowSettings: (b) => request('/api/admin/slideshow/settings', json('PUT', b)),
  approved: () => request('/api/media/approved'),
  like: (id) => request(`/api/media/${id}/like`, { method: 'POST' }),

  adminList: () => request('/api/admin/uploads'),
  approve: (id) => request(`/api/admin/uploads/${id}/approve`, { method: 'POST' }),
  reject: (id) => request(`/api/admin/uploads/${id}/reject`, { method: 'POST' }),
  remove: (id) => request(`/api/admin/uploads/${id}`, { method: 'DELETE' }),

  // Admin post-level moderation (approve/reject/delete all media in a post)
  adminPosts: () => request('/api/admin/posts'),
  approvePost: (postId) => request(`/api/admin/posts/${postId}/approve`, { method: 'POST' }),
  archivePost: (postId) => request(`/api/admin/posts/${postId}/archive`, { method: 'POST' }),
  unarchivePost: (postId) => request(`/api/admin/posts/${postId}/unarchive`, { method: 'POST' }),
  rejectPost: (postId) => request(`/api/admin/posts/${postId}/reject`, { method: 'POST' }),
  removePost: (postId) => request(`/api/admin/posts/${postId}`, { method: 'DELETE' }),

  // Upload with progress (fetch cannot report upload progress)
  upload(formData, onProgress, options = {}) {
    let xhr;
    const promise = new Promise((resolve, reject) => {
      xhr = new XMLHttpRequest();

      if (options && options.signal) {
        if (options.signal.aborted) {
          return reject(new Error('Upload was cancelled.'));
        }
        options.signal.addEventListener('abort', () => xhr.abort());
      }

      xhr.timeout = 10 * 60 * 1000; // 10 minutes timeout for heavy videos

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress?.(percent, e.loaded, e.total);
        }
      };

      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
        if (xhr.status === 401) return reject(new Error('Your session expired. Please sign in again.'));
        if (xhr.status === 413) return reject(new Error('File is too large (max 100MB per file).'));
        reject(new Error(data.error || `Upload failed (HTTP ${xhr.status})`));
      };

      xhr.ontimeout = () => reject(new Error('Upload timed out. The file might be too heavy or your network connection is too slow.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      xhr.onerror = () => reject(new Error('Connection lost during upload. The file may be too heavy for your connection, or your connection dropped. Try again or use a smaller file.'));

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });

    promise.abort = () => {
      if (xhr) {
        try { xhr.abort(); } catch { /* ignore */ }
      }
    };

    return promise;
  }
};

export function formatDate(s) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return 'Ukuran tidak tersedia';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
