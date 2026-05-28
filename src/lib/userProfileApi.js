// ─────────────────────────────────────────────────────────────────────────────
//  src/lib/userProfileApi.js — Cliente API para el sistema de perfiles
//
//  Todas las funciones son async y devuelven { success, ...data } o lanzan Error.
//  Reutilizables en cualquier componente/hook de la app.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

// ── Perfil propio ─────────────────────────────────────────────────────────────

export async function getMyProfile() {
  const res = await fetch(`${BASE_URL}/api/user-profile/me`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function updateMyProfile(data) {
  const res = await fetch(`${BASE_URL}/api/user-profile/me`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(data),
  });
  return handleResponse(res);
}

// ── Avatar (multipart/form-data — Multer) ─────────────────────────────────────

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file); // field name que espera Multer

  const res = await fetch(`${BASE_URL}/api/user-profile/me/avatar`, {
    method:  'POST',
    headers: authHeaders(), // NO añadir Content-Type: multer lo infiere del FormData
    body:    formData,
  });
  return handleResponse(res);
}

// ── Perfil público ────────────────────────────────────────────────────────────

export async function getPublicProfile(username) {
  const res = await fetch(`${BASE_URL}/api/user-profile/${username}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Búsqueda (autocomplete) ───────────────────────────────────────────────────

export async function searchUsers(q, limit = 8) {
  if (!q || q.length < 1) return { success: true, results: [] };
  const params = new URLSearchParams({ q, limit });
  const res = await fetch(`${BASE_URL}/api/user-profile/search?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Explorar ──────────────────────────────────────────────────────────────────

export async function exploreUsers(page = 1) {
  const params = new URLSearchParams({ page });
  const res = await fetch(`${BASE_URL}/api/user-profile/explore?${params}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Redes sociales ────────────────────────────────────────────────────────────

export async function updateSocialLinks(links) {
  const res = await fetch(`${BASE_URL}/api/user-profile/me/social-links`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ links }),
  });
  return handleResponse(res);
}

export async function deleteSocialLink(id) {
  const res = await fetch(`${BASE_URL}/api/user-profile/me/social-links/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
