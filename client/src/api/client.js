const API_BASE = '/api';

function withToken(url) {
  const token = localStorage.getItem('token');
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
  },
  alliances: {
    list: () => request('/alliances'),
    create: (data) => request('/alliances', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/alliances/${id}`),
    update: (id, data) => request(`/alliances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/alliances/${id}`, { method: 'DELETE' }),
    requirements: (id) => request(`/alliances/${id}/requirements`),
  },
  documentTypes: {
    list: () => request('/document-types'),
    activos: () => request('/document-types?soloActivos=true'),
    create: (data) => request('/document-types', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/document-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/document-types/${id}`, { method: 'DELETE' }),
  },
  files: {
    upload: (allianceId, file, indexData = null) => {
      const fd = new FormData();
      fd.append('file', file);
      if (indexData) {
        fd.append('documentTypeId', indexData.documentTypeId);
        fd.append('pageFrom', String(indexData.pageFrom));
        fd.append('pageTo', String(indexData.pageTo));
        if (indexData.notas) fd.append('notas', indexData.notas);
      }
      return request(`/alliances/${allianceId}/files`, { method: 'POST', body: fd });
    },
    indexes: (fileId) => request(`/files/${fileId}/indexes`),
    contentUrl: (fileId) => withToken(`/api/files/${fileId}/content`),
  },
  indexes: {
    create: (fileId, data) =>
      request(`/files/${fileId}/indexes`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/indexes/${id}`, { method: 'DELETE' }),
    exportUrl: (id) => withToken(`/api/indexes/${id}/export`),
    viewUrl: (id) => withToken(`/api/indexes/${id}/export?inline=true`),
  },
  evaluations: {
    get: (allianceId) => request(`/evaluations/${allianceId}`),
    save: (allianceId, items) =>
      request(`/evaluations/${allianceId}`, { method: 'PUT', body: JSON.stringify({ items }) }),
    pdfUrl: (allianceId) => withToken(`/api/evaluations/${allianceId}/pdf`),
  },
  users: {
    list: () => request('/users'),
    create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
