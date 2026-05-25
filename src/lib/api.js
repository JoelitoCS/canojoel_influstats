// Base URL compartida por todas las llamadas al backend.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Error propio para conservar status HTTP y cuerpo de respuesta.
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Wrapper de fetch: añade JSON, token JWT y parseo de errores en un solo sitio.
export async function apiFetch(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(data?.message || "Error en la petición", response.status, data);
  }

  return data;
}

// Endpoints de autenticación consumidos por las pantallas de login y registro.
export const authApi = {
  login: (credentials) =>
    apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (credentials) =>
    apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};

// Endpoints de métricas semanales por perfil social.
export const metricsApi = {
  // Guarda un registro semanal → POST /api/metrics/:profileId
  create: (profileId, data) =>
    apiFetch(`/api/metrics/${profileId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Obtiene el historial completo → GET /api/metrics/:profileId
  getAll: (profileId) => apiFetch(`/api/metrics/${profileId}`),

  // Resumen global de metricas actuales del usuario -> GET /api/metrics/summary
  getSummary: () => apiFetch('/api/metrics/summary'),

  // Comparativa actual vs período anterior -> GET /api/metrics/compare/:profileId?period=X[&fromDate=YYYY-MM-DD]
  // period: '1w' | '2w' | '1m' | '3m' | '6m' | '1y' | 'custom'
  // fromDate: solo si period === 'custom' (YYYY-MM-DD)
  compare: (profileId, period = '1w', fromDate = null) => {
    const params = new URLSearchParams({ period });
    if (fromDate) params.set('fromDate', fromDate);
    return apiFetch(`/api/metrics/compare/${profileId}?${params.toString()}`);
  },
};

// Endpoints de perfiles sociales asociados al usuario autenticado.
export const rankingApi = {
  // GET /api/ranking?platform=instagram&sort=followers
  get: (platform, sort = 'followers') =>
    apiFetch(`/api/ranking?platform=${platform}&sort=${sort}`),
};

// Endpoints de perfiles sociales asociados al usuario autenticado.
export const profilesApi = {
  // Obtiene todos los perfiles del usuario → GET /api/profiles
  getAll: () => apiFetch("/api/profiles"),

  // POST /api/profiles → crea un perfil nuevo
  create: (profile) =>
    apiFetch("/api/profiles", {
      method: "POST",
      body: JSON.stringify(profile),
    }),

  // Actualiza un perfil existente → PUT /api/profiles/:id
  update: (id, profile) =>
    apiFetch(`/api/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  // Elimina un perfil → DELETE /api/profiles/:id
  delete: (id) =>
    apiFetch(`/api/profiles/${id}`, {
      method: "DELETE",
    }),
};

// Endpoints de administración (requiere role='admin').
export const adminApi = {
  // Usuarios
  getUsers:      ()         => apiFetch('/api/admin/users'),
  deleteUser:    (userId)   => apiFetch(`/api/admin/users/${userId}`,   { method: 'DELETE' }),

  // Perfiles
  getAllProfiles: ()          => apiFetch('/api/admin/profiles'),
  deleteProfile: (profileId) => apiFetch(`/api/admin/profiles/${profileId}`, { method: 'DELETE' }),

  // Métricas
  getMetrics:       (profileId) => apiFetch(`/api/admin/metrics/${profileId}`),
  updateMetric:     (metricsId, data) => apiFetch(`/api/admin/metrics/${metricsId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMetric:     (metricsId) => apiFetch(`/api/admin/metrics/${metricsId}`,                  { method: 'DELETE' }),
  deleteAllMetrics: (profileId) => apiFetch(`/api/admin/all-metrics/${profileId}`, { method: 'DELETE' }),
};
