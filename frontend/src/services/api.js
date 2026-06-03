const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...restOptions,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const detail = data.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((e) => e.msg).join(', ')
        : '요청에 실패했습니다.';
    throw new Error(message);
  }
  return data;
}

export const authApi = {
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

export const taxApi = {
  calculateVat: (body, token) =>
    request('/tax/vat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  getVatHistory: (token) =>
    request('/tax/vat/history', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const aiApi = {
  analyze: (body, token) =>
    request('/ai/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
};

export const salaryApi = {
  calculate: (body, token) =>
    request('/salary/calculate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  getHistory: (token) =>
    request('/salary/history', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export const orderApi = {
  list: (token) =>
    request('/orders/memo', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  create: (body, token) =>
    request('/orders/memo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  update: (id, body, token) =>
    request(`/orders/memo/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  remove: (id, token) =>
    request(`/orders/memo/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
