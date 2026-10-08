// api.js keeps ALL backend calls in one place.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

// ── token storage ("Remember me" → localStorage, otherwise sessionStorage) ──
export const tokenStore = {
  get: () => localStorage.getItem('token') || sessionStorage.getItem('token'),
  set(token, remember) {
    this.clear();
    (remember ? localStorage : sessionStorage).setItem('token', token);
  },
  clear() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, form, raw = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (raw && res.ok) return res;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  // auth
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  // chats
  listChats: () => request('/chats'),
  createChat: () => request('/chats', { method: 'POST', body: {} }),
  getChat: (id) => request(`/chats/${id}`),
  renameChat: (id, title) => request(`/chats/${id}`, { method: 'PATCH', body: { title } }),
  deleteChat: (id) => request(`/chats/${id}`, { method: 'DELETE' }),
  sendMessage: (id, content, model) => request(`/chats/${id}/messages`, { method: 'POST', body: { content, ...(model ? { provider: model.provider, model: model.model } : {}) } }),

  // providers (admin) + available models (everyone)
  availableModels: () => request('/providers/available'),
  listProviders: () => request('/providers'),
  saveProvider: (id, payload) => request(`/providers/${id}`, { method: 'PUT', body: payload }),
  removeProviderKey: (id) => request(`/providers/${id}/key`, { method: 'DELETE' }),
  testProvider: (id) => request(`/providers/${id}/test`, { method: 'POST' }),
  fetchProviderModels: (id) => request(`/providers/${id}/models`, { method: 'POST' }),
  saveDefaultModels: (payload) => request('/providers/defaults/models', { method: 'PUT', body: payload }),

  // knowledge base
  listDocuments: () => request('/knowledge/documents'),
  kbStatus: () => request('/knowledge/status'),
  uploadDocument: (file, fields) => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([k, v]) => v !== undefined && v !== '' && form.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
    return request('/knowledge/upload', { method: 'POST', form });
  },
  deleteDocument: (id) => request(`/knowledge/documents/${id}`, { method: 'DELETE' }),
  openDocument: async (id) => {
    const res = await request(`/knowledge/documents/${id}/file`, { raw: true });
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  },
  reindex: () => request('/knowledge/reindex', { method: 'POST' }),
  loadSampleData: () => request('/knowledge/sample-data', { method: 'POST' }),
};
