// ─────────────────────────────────────────────────────────────────────────────
//  src/lib/api.js — Capa de comunicación con el backend
//
//  Por qué existe este archivo:
//    Centraliza toda la lógica de fetch en un solo sitio.
//    Los componentes y páginas no hacen fetch directamente: importan los
//    objetos de API (authApi, profilesApi, etc.) y llaman a sus métodos.
//    Esto evita repetir headers, manejo de errores y la URL base en cada página.
//
//  Flujo de una petición:
//    Página → método de API (ej: profilesApi.create) → apiFetch → fetch nativo
//    → Si error: lanza ApiError con el status HTTP y el body del error
//    → Si ok: devuelve el JSON parseado
// ─────────────────────────────────────────────────────────────────────────────

// URL del backend. Se lee de la variable de entorno NEXT_PUBLIC_API_URL.
// NEXT_PUBLIC_ es el prefijo que exige Next.js para exponer variables al cliente.
// Si no está definida, por defecto apunta al servidor local de desarrollo.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── ApiError ──────────────────────────────────────────────────────────────────
// Clase de error personalizada que extiende Error nativo.
// Incluye el status HTTP (401, 404, 500…) y el body de la respuesta.
// Los componentes pueden hacer: catch (err) { if (err.status === 401) … }
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name   = "ApiError";
    this.status = status;  // Código HTTP (400, 401, 404, 500…)
    this.data   = data;    // Body completo de la respuesta de error
  }
}

// ── apiFetch ──────────────────────────────────────────────────────────────────
// Wrapper de fetch que:
//   1. Lee el token JWT de localStorage (solo en el navegador, no en SSR)
//   2. Añade Content-Type: application/json si hay body
//   3. Añade Authorization: Bearer <token> si hay token
//   4. Parsea la respuesta como JSON
//   5. Lanza ApiError si el status no es 2xx
export async function apiFetch(path, options = {}) {
  // typeof window !== "undefined": guard para SSR (Next.js renderiza en el servidor
  // donde no existe localStorage; esta comprobación evita el error "localStorage is not defined")
  const token   = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers);

  // Solo añadir Content-Type si hay body en la petición (GET no tiene body)
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // Inyectar el token JWT en el header Authorization (solo si existe)
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Parsear el body como JSON solo si la respuesta tiene ese Content-Type
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  // Si el servidor responde con un error (4xx o 5xx) lanzamos ApiError
  if (!response.ok) {
    throw new ApiError(data?.message || "Error en la petición", response.status, data);
  }

  return data; // El componente recibirá el JSON directamente
}

// ── authApi ───────────────────────────────────────────────────────────────────
// Métodos de autenticación. No requieren token (rutas públicas de la API).
export const authApi = {
  // Envía email, password, passwordConfirm → recibe token + datos del usuario
  login: (credentials) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),

  // Envía email, password, passwordConfirm → recibe token + datos del usuario
  register: (credentials) =>
    apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(credentials) }),
};

// ── metricsApi ────────────────────────────────────────────────────────────────
// Métodos de métricas semanales. Todas requieren token.
export const metricsApi = {
  // Guarda métricas de una semana para un perfil específico
  create: (profileId, data) =>
    apiFetch(`/api/metrics/${profileId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Obtiene el historial completo de un perfil (ordenado más reciente primero)
  getAll: (profileId) => apiFetch(`/api/metrics/${profileId}`),

  // Resumen global: totalFollowers, totalViews, avgEngagement, platformBreakdown
  getSummary: () => apiFetch('/api/metrics/summary'),

  // Perfiles con más de 7 días sin actualizar (para el banner de aviso)
  getStaleness: () => apiFetch('/api/metrics/staleness'),

  // Compara el registro actual con el de un período anterior
  // period: '1w' | '2w' | '1m' | '3m' | '6m' | '1y' | 'custom'
  // fromDate: solo se usa si period === 'custom' (formato YYYY-MM-DD)
  compare: (profileId, period = '1w', fromDate = null) => {
    const params = new URLSearchParams({ period });
    if (fromDate) params.set('fromDate', fromDate);
    return apiFetch(`/api/metrics/compare/${profileId}?${params.toString()}`);
  },
};

// ── rankingApi ────────────────────────────────────────────────────────────────
// Métodos de ranking y comparativa pública entre perfiles.
export const rankingApi = {
  // Ranking de todos los perfiles de una plataforma
  // platform: 'instagram' | 'youtube' | 'tiktok' | 'twitch'
  // sort: 'followers' | 'engagement' | 'growth' | 'views'
  get: (platform, sort = 'followers') =>
    apiFetch(`/api/ranking?platform=${platform}&sort=${sort}`),

  // Comparativa detallada entre dos perfiles (misma plataforma)
  compareProfiles: (profileA, profileB) =>
    apiFetch(`/api/ranking/compare?profileA=${profileA}&profileB=${profileB}`),
};

// ── profilesApi ───────────────────────────────────────────────────────────────
// CRUD de perfiles sociales del usuario autenticado.
export const profilesApi = {
  // Lista todos los perfiles del usuario (ordenados por createdAt desc)
  getAll: () => apiFetch("/api/profiles"),

  // Crea un perfil nuevo: { name, url, platform }
  create: (profile) =>
    apiFetch("/api/profiles", { method: "POST", body: JSON.stringify(profile) }),

  // Actualización parcial: solo los campos enviados se actualizan
  update: (id, profile) =>
    apiFetch(`/api/profiles/${id}`, { method: "PUT", body: JSON.stringify(profile) }),

  // Elimina un perfil (con sus métricas por cascada en la BD)
  delete: (id) =>
    apiFetch(`/api/profiles/${id}`, { method: "DELETE" }),
};

// ── adminApi ──────────────────────────────────────────────────────────────────
// Métodos del panel de administración. Solo funcionan con role='admin'.
// Si el usuario no es admin, la API responde 403.
export const adminApi = {
  // ── Usuarios ─────────────────────────────────────────────────────────────
  getUsers:      ()       => apiFetch('/api/admin/users'),
  deleteUser:    (userId) => apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' }),

  // ── Perfiles (cualquier usuario) ──────────────────────────────────────────
  getAllProfiles: ()          => apiFetch('/api/admin/profiles'),
  deleteProfile: (profileId) => apiFetch(`/api/admin/profiles/${profileId}`, { method: 'DELETE' }),

  // ── Métricas (cualquier perfil) ───────────────────────────────────────────
  // Obtiene el historial de métricas de cualquier perfil (sin restricción de propietario)
  getMetrics: (profileId)   => apiFetch(`/api/admin/metrics/${profileId}`),

  // Edita un registro de métricas (recalcula engagement y growth en el servidor)
  updateMetric: (metricsId, data) =>
    apiFetch(`/api/admin/metrics/${metricsId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Elimina un único registro de métricas
  deleteMetric: (metricsId) => apiFetch(`/api/admin/metrics/${metricsId}`, { method: 'DELETE' }),

  // Borra TODAS las métricas de un perfil de golpe
  deleteAllMetrics: (profileId) => apiFetch(`/api/admin/all-metrics/${profileId}`, { method: 'DELETE' }),
};
