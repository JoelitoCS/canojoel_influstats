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

// Endpoints de perfiles sociales asociados al usuario autenticado.
export const profilesApi = {
  // Obtiene todos los perfiles del usuario → GET /api/profiles
  getAll: () => apiFetch("/api/profiles"),

  // Crea un perfil nuevo → POST /api/profiles
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
