"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { profilesApi, metricsApi } from "@/lib/api";

// ─── Suscripción a localStorage (evita hydration mismatch) ───────────────────
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── Etiquetas legibles por campo ────────────────────────────────────────────
const FIELD_LABELS = {
  views:             "Visualizaciones",
  likes:             "Likes",
  subscribers:       "Suscriptores",
  paidMembers:       "Miembros de pago",
  donations:         "Donaciones (€)",
  comments:          "Comentarios",
  favorites:         "Guardados / Favoritos",
  shares:            "Compartidos",
  followers:         "Seguidores",
  subscribersTwitch: "Suscriptores Twitch",
  bits:              "Bits donados",
  posts:             "Publicaciones",
  engagement:        "Engagement (%)",
  growth:            "Crecimiento (%)",
};

const FIELD_VARIANTS = {
  views:             "accent",
  likes:             "secondary",
  subscribers:       "success",
  paidMembers:       "warning",
  donations:         "warning",
  comments:          "accent",
  favorites:         "secondary",
  shares:            "accent",
  followers:         "success",
  subscribersTwitch: "warning",
  bits:              "warning",
  posts:             "accent",
  engagement:        "secondary",
  growth:            "success",
};

const VARIANT_STYLES = {
  accent:    { icon: "text-[var(--color-accent)]",    bg: "bg-[var(--color-accent-soft)]"    },
  success:   { icon: "text-[var(--color-success)]",   bg: "bg-[var(--color-success-soft)]"   },
  secondary: { icon: "text-[var(--color-secondary)]", bg: "bg-[var(--color-secondary-soft)]" },
  warning:   { icon: "text-[var(--color-warning)]",   bg: "bg-[var(--color-warning-soft)]"   },
};

// ─── Formateo de valores ──────────────────────────────────────────────────────
const formatValue = (field, value) => {
  if (value === null || value === undefined) return "—";
  const n = parseFloat(value);
  if (isNaN(n)) return "—";
  if (field === "donations") return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  if (field === "engagement" || field === "growth") return `${n.toFixed(2)} %`;
  return n.toLocaleString("es-ES");
};

// ─── Tarjeta comparativa individual ──────────────────────────────────────────
function CompareCard({ field, current, previous, diff }) {
  const label   = FIELD_LABELS[field] || field;
  const variant = FIELD_VARIANTS[field] || "accent";
  const style   = VARIANT_STYLES[variant];

  const absVal  = diff?.absolute;
  const pctVal  = diff?.percent;
  const hasComp = absVal !== null && absVal !== undefined;
  const positive = hasComp && absVal >= 0;

  return (
    <div className="surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all duration-300 hover:border-[var(--color-border-strong)]">
      {/* Cabecera */}
      <div className="mb-4 flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] ${style.bg} ${style.icon}`}>
          <FieldIcon field={field} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </p>
      </div>

      {/* Valores actual vs anterior */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-strong)]/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">Actual</p>
          <p className="text-xl font-bold tabular-nums text-[var(--color-text)]">
            {formatValue(field, current)}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-strong)]/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-1">Anterior</p>
          <p className="text-xl font-bold tabular-nums text-[var(--color-muted)]">
            {formatValue(field, previous)}
          </p>
        </div>
      </div>

      {/* Badge diferencia */}
      {hasComp ? (
        <div className={[
          "flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2",
          positive ? "bg-[var(--color-success-soft)]" : "bg-[var(--color-error-soft)]",
        ].join(" ")}>
          <span className={`text-xs font-bold ${positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
            {positive ? "▲" : "▼"}{" "}
            {field === "donations"
              ? `${Math.abs(absVal).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
              : Math.abs(absVal).toLocaleString("es-ES")}
          </span>
          {pctVal !== null && pctVal !== undefined && (
            <span className={`text-xs font-semibold ${positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
              {positive ? "+" : ""}{pctVal.toFixed(2)} %
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-border)]/40 px-3 py-2">
          <p className="text-xs text-[var(--color-muted)] text-center">Sin datos anteriores</p>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="skeleton h-16 rounded-[var(--radius-md)]" />
        <div className="skeleton h-16 rounded-[var(--radius-md)]" />
      </div>
      <div className="skeleton h-9 rounded-[var(--radius-sm)]" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ComparePage
// ─────────────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [profiles,        setProfiles]        = useState([]);
  const [selectedId,      setSelectedId]      = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError,   setProfilesError]   = useState("");

  const [compareData,    setCompareData]    = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError,   setCompareError]   = useState("");

  // Protección de ruta
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  // Carga perfiles
  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      setProfilesError("");
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      setProfiles(list);
      if (list.length > 0) setSelectedId(list[0].id);
    } catch (err) {
      setProfilesError(err.message || "Error al cargar perfiles");
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // Carga comparativa cuando cambia el perfil
  const fetchCompare = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      setLoadingCompare(true);
      setCompareError("");
      setCompareData(null);
      const data = await metricsApi.compare(profileId);
      setCompareData(data);
    } catch (err) {
      setCompareError(err.message || "Error al cargar la comparativa");
    } finally {
      setLoadingCompare(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchCompare(selectedId);
  }, [selectedId, fetchCompare]);

  if (token === null) return null;

  const activeProfile = profiles.find((p) => p.id === selectedId) || null;
  const canCompare    = compareData && compareData.previous !== null;

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* ── Cabecera ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
              Comparativa semanal
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Métricas actuales vs. semana anterior · período{" "}
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                1w
              </span>
            </p>
          </div>

          {/* Selector de perfil */}
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Perfil
            </label>
            {loadingProfiles ? (
              <div className="skeleton h-11 w-full rounded-[var(--radius-md)]" />
            ) : (
              <select
                className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
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
          </div>
        </div>

        {/* ── Errores ──────────────────────────────────────────────── */}
        {(profilesError || compareError) && (
          <p className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {profilesError || compareError}
          </p>
        )}

        {/* ── Resumen de fechas comparadas ─────────────────────────── */}
        {compareData && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <CalendarIcon />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {activeProfile?.username} · {activeProfile?.platform}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {compareData.previous ? (
                      <>
                        Semana anterior:{" "}
                        <strong className="text-[var(--color-text)]">
                          {new Date(compareData.previous.weekDate).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </strong>
                        {" · "}Semana actual:{" "}
                        <strong className="text-[var(--color-text)]">
                          {new Date(compareData.current.weekDate).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </strong>
                      </>
                    ) : (
                      <>
                        Única entrada:{" "}
                        <strong className="text-[var(--color-text)]">
                          {new Date(compareData.current.weekDate).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {!canCompare && (
                <span className="rounded-full border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
                  ⚠ Necesitas al menos 2 semanas para comparar
                </span>
              )}
            </div>
          </Card>
        )}

        {/* ── Grid de tarjetas comparativas ───────────────────────── */}
        {loadingCompare ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : compareData ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(compareData.fields || []).map((field) => (
              <CompareCard
                key={field}
                field={field}
                current={compareData.current?.[field]}
                previous={compareData.previous?.[field]}
                diff={compareData.diff?.[field]}
              />
            ))}
          </div>
        ) : !compareError && !loadingProfiles && profiles.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              No tienes perfiles registrados.{" "}
              <a href="/dashboard/plataformas" className="text-[var(--color-accent)] underline underline-offset-2">
                Añade uno
              </a>{" "}
              para empezar a comparar.
            </p>
          </Card>
        ) : null}

      </div>
    </AppShell>
  );
}

// ─── Icono genérico por campo ─────────────────────────────────────────────────
function FieldIcon({ field }) {
  switch (field) {
    case "views":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "likes":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case "subscribers":
    case "followers":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "paidMembers":
    case "subscribersTwitch":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "donations":
    case "bits":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2M12 16v2M9 12h6"/></svg>;
    case "comments":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "favorites":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
    case "shares":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>;
    case "posts":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case "growth":
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    default:
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
  }
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
