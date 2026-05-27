# InfluStats Frontend

Cliente web para la plataforma InfluStats. Consume la API REST propia para gestión y visualización de métricas de influencers.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Recharts 3

---

## Índice

1. [Instalación](#1-instalación)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Scripts disponibles](#3-scripts-disponibles)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Rutas y páginas](#5-rutas-y-páginas)
6. [Capa de API (`lib/api.js`)](#6-capa-de-api-libapiJs)
7. [Componentes principales](#7-componentes-principales)
8. [Autenticación](#8-autenticación)
9. [Sistema de temas](#9-sistema-de-temas)

---

## 1. Instalación

```bash
npm install
npm run dev
```

Disponible en `http://localhost:3000`.

---

## 2. Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3001   # URL de la API (por defecto localhost:3001)
```

---

## 3. Scripts disponibles

| Script | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Linting con ESLint |

---

## 4. Estructura del proyecto

```
src/
├── app/
│   ├── layout.js              # Layout raíz: fuentes, tema, metadata
│   ├── globals.css            # Variables CSS, tokens de diseño, animaciones
│   ├── page.js                # Landing / Home (pública)
│   ├── login/page.js          # Formulario de login
│   ├── register/page.js       # Formulario de registro
│   └── dashboard/
│       ├── page.js            # Panel principal: perfiles y resumen de métricas
│       ├── metrics/page.js    # Entrada y historial de métricas semanales
│       ├── rankings/page.js   # Ranking global por plataforma
│       ├── comparar/page.js   # Comparativa visual entre dos perfiles
│       ├── admin/page.js      # Panel de administración (solo rol admin)
│       ├── instagram/         # Vista detalle por plataforma
│       ├── tiktok/
│       ├── youtube/
│       └── twitch/
├── components/
│   ├── layout/
│   │   └── AppShell.jsx       # Sidebar + header + contenedor de página
│   └── ui/
│       ├── AuthCard.jsx       # Tarjeta común para login/registro
│       ├── Button.jsx         # Botón con variantes y estado loading
│       ├── Card.jsx           # Contenedor de superficie
│       ├── EditProfileModal.jsx
│       ├── Input.jsx          # Input con label, error y accesibilidad
│       ├── MetricCard.jsx     # Stat card con animación countUp y skeleton
│       ├── PlatformIcon.jsx   # SVG de cada plataforma + colores de marca
│       ├── PlatformPage.jsx   # Wrapper de vista por plataforma
│       ├── ProfilesTable.jsx  # Tabla de perfiles con acciones
│       └── ThemeToggle.jsx    # Botón claro / oscuro
└── lib/
    └── api.js                 # Wrapper de fetch + todos los objetos de API
```

---

## 5. Rutas y páginas

### `/` — Landing (pública)

Página de presentación con hero, lista de plataformas soportadas y card de estado. Redirige al dashboard si ya hay sesión.

---

### `/login` y `/register`

Formularios con validación en cliente. Al completarse guardan `token` (y `userRole` en admin) en `localStorage` y redirigen al dashboard.

**Reglas de contraseña:** mínimo 8 caracteres, mayúsculas + minúsculas + números.

---

### `/dashboard` — Panel principal ⚙️ *Requiere auth*

Carga en paralelo tres llamadas a la API:

- `metricsApi.getSummary()` → 4 stat cards animadas: seguidores totales, engagement medio, nº de perfiles, visitas totales
- `metricsApi.getStaleness()` → banner de aviso para perfiles con más de 7 días sin actualizar
- `profilesApi.getAll()` → tabla de perfiles con acciones de crear, editar y eliminar

La sección de distribución por plataforma muestra barras de progreso con el porcentaje de seguidores de cada red social.

---

### `/dashboard/metrics` — Métricas semanales ⚙️ *Requiere auth*

Formulario adaptativo: los campos cambian según la plataforma del perfil seleccionado.

| Plataforma | Campos |
|---|---|
| Instagram | Visualizaciones, Likes, Guardados, Seguidores, Publicaciones |
| YouTube | Visitas, Likes, Suscriptores, Miembros de pago, Donaciones (€) |
| TikTok | Visitas, Likes, Comentarios, Favoritos, Compartidos, Seguidores |
| Twitch | Visualizaciones, Seguidores, Suscriptores (Prime+pago), Bits |

El engagement se calcula automaticamente segun la plataforma:

| Plataforma | Formula de engagement |
|---|---|
| Instagram | `((likes + guardados) / visualizaciones) * 100` |
| YouTube | `(likes / visitas) * 100` |
| TikTok | `((likes + comentarios + favoritos + compartidos) / visitas) * 100` |
| Twitch | `(suscriptores / seguidores) * 100` |

El historial incluye tabla paginada (8 filas), ordenación por cualquier columna y badge de crecimiento semanal (▲/▼/Primera semana). El color de fila es verde o rojo según `growth`.

---

### `/dashboard/rankings` — Ranking global ⚙️ *Requiere auth*

Ranking de todos los perfiles registrados con al menos un registro de métricas. Filtra por plataforma y ordena por Seguidores, Engagement, Crecimiento o Visitas. El top 3 muestra medallas arcade y fondo de color de plataforma.

---

### `/dashboard/comparar` — Comparativa ⚙️ *Requiere auth*

Seleccionar plataforma, elegir Perfil A y Perfil B (los selectores se filtran mutuamente) y pulsar Comparar. Llama a `rankingApi.compareProfiles()`.

Resultado: marcador con campos ganados, gráfica de barras con animación de rebote CSS, gráfica de radar normalizada y tabla campo a campo con ganador y diferencia porcentual.

---

### `/dashboard/admin` — Administración ⚙️ *Requiere auth + rol `admin`*

Redirige a `/dashboard` si el usuario no es admin. Tres pestañas:

- **Usuarios:** listado global con email, rol, nº perfiles, fechas. Borrar con doble confirmación.
- **Perfiles:** listado global con propietario y contador de métricas. Borrar con confirmación.
- **Métricas:** selector de perfil → tabla de entradas semanales con botones Editar (modal completo) y Eliminar. Botón para borrar todas las métricas de un perfil de una vez.

---

## 6. Capa de API (`lib/api.js`)

Todas las llamadas pasan por `apiFetch`, que añade `Content-Type`, inyecta el token JWT de `localStorage` y lanza un `ApiError` con `status` y `data` si la respuesta no es `ok`.

### `authApi`

| Método | Endpoint |
|---|---|
| `login(credentials)` | `POST /api/auth/login` |
| `register(credentials)` | `POST /api/auth/register` |

### `profilesApi`

| Método | Endpoint |
|---|---|
| `getAll()` | `GET /api/profiles` |
| `create(profile)` | `POST /api/profiles` |
| `update(id, profile)` | `PUT /api/profiles/:id` |
| `delete(id)` | `DELETE /api/profiles/:id` |

### `metricsApi`

| Método | Endpoint |
|---|---|
| `create(profileId, data)` | `POST /api/metrics/:profileId` |
| `getAll(profileId)` | `GET /api/metrics/:profileId` |
| `getSummary()` | `GET /api/metrics/summary` |
| `getStaleness()` | `GET /api/metrics/staleness` |
| `compare(profileId, period, fromDate?)` | `GET /api/metrics/compare/:profileId?period=X` |

### `rankingApi`

| Método | Endpoint |
|---|---|
| `get(platform, sort)` | `GET /api/ranking?platform=X&sort=Y` |
| `compareProfiles(profileA, profileB)` | `GET /api/ranking/compare?profileA=X&profileB=Y` |

### `adminApi`

| Método | Endpoint |
|---|---|
| `getUsers()` | `GET /api/admin/users` |
| `deleteUser(userId)` | `DELETE /api/admin/users/:userId` |
| `getAllProfiles()` | `GET /api/admin/profiles` |
| `deleteProfile(profileId)` | `DELETE /api/admin/profiles/:profileId` |
| `getMetrics(profileId)` | `GET /api/admin/metrics/:profileId` |
| `updateMetric(metricsId, data)` | `PUT /api/admin/metrics/:metricsId` |
| `deleteMetric(metricsId)` | `DELETE /api/admin/metrics/:metricsId` |
| `deleteAllMetrics(profileId)` | `DELETE /api/admin/all-metrics/:profileId` |

---

## 7. Componentes principales

| Componente | Descripción |
|---|---|
| `AppShell` | Sidebar con navegación + header con ThemeToggle + contenedor de página |
| `MetricCard` | Stat card con countUp, skeleton de carga y formateador (k/M) |
| `PlatformIcon` | SVG inline del icono de cada plataforma en su color de marca |
| `ProfilesTable` | Tabla con icono de plataforma, enlace a URL y botones de editar/eliminar |
| `Button` | Variantes `primary`, `secondary`, `ghost`; prop `loading` con spinner |
| `Input` | Label en uppercase, borde de error animado, `role="alert"` en el mensaje |
| `ThemeToggle` | Alterna `data-theme` en `<html>` y emite evento `themechange` |

**Colores de plataforma** (variables CSS en `globals.css`):

| Plataforma | Variable |
|---|---|
| Instagram | `--color-instagram` |
| TikTok | `--color-tiktok` (negro en claro, blanco en oscuro) |
| YouTube | `--color-youtube` |
| Twitch | `--color-twitch` |

---

## 8. Autenticación

JWT guardado en `localStorage`. Claves:

- `token` — JWT recibido al login/registro (30 días)
- `userRole` — `"user"` o `"admin"` (usado por `/dashboard/admin`)

Protección de rutas con `useSyncExternalStore` para leer `localStorage` sin hydration mismatch:

```js
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const token = useSyncExternalStore(subscribeStorage, getToken, () => null);

useEffect(() => {
  if (token === null) router.replace("/login");
}, [token, router]);
```

El snapshot de servidor devuelve `null` (oculta contenido protegido durante SSR), el cliente lee el valor real de `localStorage`.

---

## 9. Sistema de temas

Un script `beforeInteractive` aplica el tema antes de que React hidrate, evitando el flash:

```js
const storedTheme = localStorage.getItem("theme");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.dataset.theme = storedTheme || systemTheme;
```

`ThemeToggle` alterna el atributo `data-theme` en `<html>` y emite un evento `themechange` al que se suscribe `PlatformIcon` para ajustar los colores de TikTok. Todos los colores son variables CSS en `globals.css`, por lo que el cambio es instantáneo sin re-renderizado.
