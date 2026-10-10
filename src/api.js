const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function headers(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function req(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (b) => req("/api/auth/register", { method: "POST", body: b }),
  login: (b) => req("/api/auth/login", { method: "POST", body: b }),
  me: (t) => req("/api/auth/me", { token: t }),
  listNotes: (t, page = 1, limit = 10) => req(`/api/notes?page=${page}&limit=${limit}`, { token: t }),
  createNote: (t, b) => req("/api/notes", { method: "POST", body: b, token: t }),
  updateNote: (t, id, b) => req(`/api/notes/${id}`, { method: "PATCH", body: b, token: t }),
  deleteNote: (t, id) => req(`/api/notes/${id}`, { method: "DELETE", token: t }),
  createPost: (t, b) => req("/api/posts", { method: "POST", body: b, token: t }),
  userPosts: (id, page = 1, limit = 10) => req(`/api/users/${id}/posts?page=${page}&limit=${limit}`),
  adminUsers: (t, page = 1, limit = 10) => req(`/api/admin/users?page=${page}&limit=${limit}`, { token: t }),
  adminCreateUser: (t, b) => req("/api/admin/users", { method: "POST", body: b, token: t }),
  adminPatchUser: (t, id, b) => req(`/api/admin/users/${id}`, { method: "PATCH", body: b, token: t }),
  adminDeleteUser: (t, id) => req(`/api/admin/users/${id}`, { method: "DELETE", token: t }),
  adminNotes: (t, page = 1, limit = 10) => req(`/api/admin/notes?page=${page}&limit=${limit}`, { token: t }),
  usersByInterest: (t, page = 1, limit = 10) =>
    req(`/api/admin/users-by-interest?page=${page}&limit=${limit}`, { token: t }),
};

export { API };
