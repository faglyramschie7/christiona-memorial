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

  // Upload with progress (fetch cannot report upload progress)
  upload(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
        if (xhr.status === 401) return reject(new Error('Your session expired. Please sign in again.'));
        if (xhr.status === 413) return reject(new Error('File is too large (max 100MB).'));
        reject(new Error(data.error || `Upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('Connection lost during upload. Try again or use a smaller file.'));
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }
};

export function formatDate(s) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
