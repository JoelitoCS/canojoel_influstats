"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { profilesApi, metricsApi } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE CAMPOS POR PLATAFORMA
//
//  Cada entrada define qué inputs mostrar y cómo enviarlos al backend.
//  La clave coincide con el valor de profile.platform en la BD.
//
//  Cada campo tiene:
//    key        → nombre del campo en el body que espera la API
//    label      → etiqueta visible en el formulario
//    placeholder→ ejemplo de valor
//    hint       → texto gris debajo de la etiqueta (opcional)
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORM_FIELDS = {
  youtube: {
    label: "YouTube",
    engagementFormula: "(likes / visitas) × 100",
    fields: [
      { key: "views",       label: "Visitas",           placeholder: "125000" },
      { key: "likes",       label: "Likes",             placeholder: "8400" },
      { key: "subscribers", label: "Suscriptores",      placeholder: "52000" },
      { key: "paidMembers", label: "Miembros de pago",  placeholder: "320",
        hint: "Miembros con membresía de pago del canal" },
    ],
  },

  tiktok: {
    label: "TikTok",
    engagementFormula: "((likes + comentarios + favoritos + compartidos) / visitas) × 100",
    fields: [
      { key: "views",     label: "Visitas",      placeholder: "980000" },
      { key: "likes",     label: "Likes",        placeholder: "74000" },
      { key: "comments",  label: "Comentarios",  placeholder: "3200" },
      { key: "favorites", label: "Favoritos",    placeholder: "12500" },
      { key: "shares",    label: "Compartidos",  placeholder: "6800" },
      { key: "followers", label: "Seguidores",   placeholder: "210000" },
    ],
  },

  twitch: {
    label: "Twitch",
    engagementFormula: "(suscriptores / seguidores) × 100",
    fields: [
      { key: "views",             label: "Visualizaciones",              placeholder: "45000" },
      { key: "followers",         label: "Seguidores",                   placeholder: "18000" },
      // camelCase para coincidir con la clave que espera la API y el schema de Prisma.
      { key: "subscribersTwitch", label: "Suscriptores (Prime + pago)",  placeholder: "940",
        hint: "Total de suscriptores, independientemente de si son Twitch Prime o de pago" },
      { key: "bits",              label: "Bits donados",                 placeholder: "15000",
        hint: "Total de bits recibidos en el canal durante la semana" },
    ],
  },

  instagram: {
    label: "Instagram",
    engagementFormula: "((likes + guardados) / visitas) × 100",
    fields: [
      { key: "views",     label: "Visualizaciones",    placeholder: "62000" },
      { key: "likes",     label: "Likes",              placeholder: "4100" },
      { key: "favorites", label: "Guardados",          placeholder: "890" },
      { key: "followers", label: "Seguidores",         placeholder: "28000" },
      { key: "posts",     label: "Publicaciones",      placeholder: "7" },
    ],
  },
};

// ─── Suscripción a localStorage para detectar cambios de token ──────────────
// Mismo patrón que el dashboard principal: evita el hydration mismatch de Next.js
// porque el servidor no tiene acceso a localStorage (devuelve null).
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── Formulario base (siempre presente) ────────────────────────────────────
const BASE_FORM = { profileId: "", weekDate: "" };

// Construye un formulario vacío con todos los campos de todas las plataformas
// inicializados a "" para que React no cambie inputs de controlado a no controlado.
const buildEmptyForm = () => {
  const form = { ...BASE_FORM };
  Object.values(PLATFORM_FIELDS).forEach(({ fields }) => {
    fields.forEach(({ key }) => { form[key] = ""; });
  });
  return form;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MetricsPage
// ─────────────────────────────────────────────────────────────────────────────
export default function MetricsPage() {
  const router = useRouter();

  const [form, setForm]       = useState(buildEmptyForm);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles]               = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError]     = useState("");

  const [history, setHistory]               = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // useSyncExternalStore garantiza que servidor y cliente devuelvan el mismo
  // snapshot inicial (null), evitando el hydration mismatch de Next.js.
  const token = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  // ── Protección de ruta ──────────────────────────────────────────────────
  // En cuanto el store confirma que no hay token, redirige al login.
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [router, token]);

  if (token === null) return null;

  // ── Carga inicial de perfiles ───────────────────────────────────────────
  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      setProfilesError("");
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      setProfiles(list);
      if (list.length > 0) setForm((f) => ({ ...f, profileId: list[0].id }));
    } catch (err) {
      setProfilesError(err.message || "Error al cargar perfiles");
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // ── Carga del historial cuando cambia el perfil ─────────────────────────
  const fetchHistory = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      setLoadingHistory(true);
      const data = await metricsApi.getAll(profileId);
      setHistory(data?.metrics || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (form.profileId) fetchHistory(form.profileId);
  }, [form.profileId, fetchHistory]);

  // ── Perfil activo y su plataforma ───────────────────────────────────────
  // Buscamos el objeto perfil completo para leer la plataforma.
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === form.profileId) || null,
    [profiles, form.profileId]
  );

  // Configuración de campos para la plataforma activa.
  const platformConfig = activeProfile
    ? PLATFORM_FIELDS[activeProfile.platform?.toLowerCase()] || null
    : null;

  // ── Actualiza un campo y limpia su error ────────────────────────────────
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    setSuccess("");
  };

  // ── Validación dinámica según plataforma ────────────────────────────────
  const validate = (data, config) => {
    const e = {};

    if (!data.profileId) e.profileId = "Selecciona un perfil";

    if (!data.weekDate) {
      e.weekDate = "Introduce la fecha de la semana";
    } else if (isNaN(new Date(data.weekDate).getTime())) {
      e.weekDate = "La fecha no es válida";
    }

    // Solo validamos los campos de la plataforma activa.
    if (config) {
      config.fields.forEach(({ key, label }) => {
        const n = Number(data[key]);
        if (data[key] === "" || isNaN(n) || n < 0 || !Number.isInteger(n)) {
          e[key] = `${label} debe ser un número entero ≥ 0`;
        }
      });
    }

    return e;
  };

  // ── Envío del formulario ─────────────────────────────────────────────────
  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate(form, platformConfig);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setLoading(true);

      // Construimos el body con solo los campos de la plataforma activa.
      // El backend ignora campos extra pero así enviamos solo lo necesario.
      const body = { weekDate: form.weekDate };
      platformConfig.fields.forEach(({ key }) => {
        body[key] = Number(form[key]);
      });

      const data = await metricsApi.create(form.profileId, body);
      setSuccess(data.message || "Métricas guardadas correctamente ✓");
      // Reseteamos manteniendo el perfil activo.
      setForm((prev) => ({ ...buildEmptyForm(), profileId: prev.profileId }));
      fetchHistory(form.profileId);
    } catch (err) {
      setErrors({ general: err.message || "Error al guardar métricas" });
    } finally {
      setLoading(false);
    }
  };

  // ── Formateador de fecha ─────────────────────────────────────────────────
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

  // ── Columnas de la tabla de historial según plataforma activa ───────────
  // Mostramos solo los campos que usa esa plataforma + engagement.
  const historyColumns = useMemo(() => {
    if (!platformConfig) return [];
    return [
      { key: "weekDate",  label: "Semana",     format: (v) => formatDate(v) },
      ...platformConfig.fields.map(({ key, label }) => ({
        key,
        label,
        // Bits y campos numéricos grandes con separador de miles.
        format: (v) => v !== null && v !== undefined
          ? Number(v).toLocaleString("es-ES")
          : "—",
      })),
      {
        key: "engagement",
        label: "Engagement",
        // Badge verde para el engagement.
        format: (v) => v,
        isEngagement: true,
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformConfig]);

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* ── Cabecera ────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
            Estadísticas semanales
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Los campos cambian según la plataforma. El engagement se calcula automáticamente.
          </p>
        </div>

        {/* ── Formulario ──────────────────────────────────────────────── */}
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Nueva entrada semanal
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Selecciona el perfil y rellena los datos de la semana.
            </p>
          </div>

          {profilesError && (
            <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
              {profilesError}
            </p>
          )}

          <form className="grid gap-4" onSubmit={handleSubmit}>

            {errors.general && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
                {errors.general}
              </p>
            )}

            {success && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">
                {success}
              </p>
            )}

            {/* ── Selector de perfil ─────────────────────────────────── */}
            <div className="flex w-full flex-col gap-1.5">
              <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
                Perfil social
              </label>
              {loadingProfiles ? (
                <div className="skeleton h-11 w-full" />
              ) : (
                <select
                  className={[
                    "h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none",
                    "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
                    errors.profileId ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
                  ].join(" ")}
                  value={form.profileId}
                  onChange={(e) => handleChange("profileId", e.target.value)}
                >
                  {profiles.length === 0 && (
                    <option value="">— Sin perfiles registrados —</option>
                  )}
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username} ({p.platform})
                    </option>
                  ))}
                </select>
              )}
              {errors.profileId && (
                <p className="animate-fade-in text-xs text-[var(--color-error)]" role="alert">
                  {errors.profileId}
                </p>
              )}
            </div>

            {/* ── Fecha de la semana ─────────────────────────────────── */}
            <Input
              label="Semana (fecha de inicio)"
              type="date"
              value={form.weekDate}
              onChange={(e) => handleChange("weekDate", e.target.value)}
              error={errors.weekDate}
            />

            {/* ── Bloque dinámico: campos de la plataforma activa ───── */}
            {platformConfig ? (
              <>
                {/* Aviso de la fórmula de engagement para esta plataforma */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-accent-soft)]/30 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                    {platformConfig.label} — métricas requeridas
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    Engagement: {platformConfig.engagementFormula}
                  </p>
                </div>

                {/* Grid de inputs: máx. 3 columnas en pantallas grandes */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {platformConfig.fields.map(({ key, label, placeholder, hint }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <Input
                        label={label}
                        type="number"
                        min="0"
                        step="1"
                        value={form[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        error={errors[key]}
                        placeholder={placeholder}
                      />
                      {/* Pista aclaratoria bajo el campo (solo si existe) */}
                      {hint && !errors[key] && (
                        <p className="text-[11px] leading-tight text-[var(--color-muted)]">
                          {hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Estado vacío si no hay perfil seleccionado con plataforma conocida.
              <p className="py-4 text-center text-sm text-[var(--color-muted)]">
                Selecciona un perfil para ver los campos disponibles.
              </p>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={profiles.length === 0 || !platformConfig}
              className="w-full sm:w-fit"
            >
              Guardar estadísticas
            </Button>
          </form>
        </Card>

        {/* ── Historial del perfil seleccionado ───────────────────────── */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Historial de métricas
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                Registros guardados para el perfil seleccionado.
              </p>
            </div>
            {history.length > 0 && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                {history.length} {history.length === 1 ? "registro" : "registros"}
              </span>
            )}
          </div>

          {loadingHistory ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Aún no hay estadísticas para este perfil.
              <br />
              <span className="text-[var(--color-accent)]">¡Introduce tu primera entrada arriba!</span>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-widest text-[var(--color-muted)]">
                    {/* Las columnas se generan dinámicamente según la plataforma */}
                    {historyColumns.map((col) => (
                      <th key={col.key} className="pb-3 pr-4 last:pr-0">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {history.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-[var(--color-surface-strong)]/40">
                      {historyColumns.map((col) => (
                        <td key={col.key} className="py-3 pr-4 last:pr-0">
                          {col.isEngagement ? (
                            // Badge verde para el engagement calculado (solo lectura).
                            <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                              {parseFloat(row[col.key]).toFixed(2)} %
                            </span>
                          ) : (
                            <span className={col.key === "weekDate" ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text)]"}>
                              {col.format(row[col.key])}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
