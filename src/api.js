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

export const api = {
  session: () => request('/api/auth/session'),
  login: (b) => request('/api/auth/login', json('POST', b)),
  register: (b) => request('/api/auth/register', json('POST', b)),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  tributes: () => request('/api/tributes'),
  postTribute: (b) => request('/api/tributes', json('POST', b)),

  approved: () => request('/api/media/approved'),
  like: (id) => request(`/api/media/${id}/like`, { method: 'POST' }),

  adminList: () => request('/api/admin/uploads'),
  approve: (id) => request(`/api/admin/uploads/${id}/approve`, { method: 'POST' }),
  reject: (id) => request(`/api/admin/uploads/${id}/reject`, { method: 'POST' }),
  remove: (id) => request(`/api/admin/uploads/${id}`, { method: 'DELETE' }),

  // Admin post-level moderation (approve/reject/delete all media in a post)
  adminPosts: () => request('/api/admin/posts'),
  approvePost: (postId) => request(`/api/admin/posts/${postId}/approve`, { method: 'POST' }),
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
