"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { rankingApi } from "@/lib/api";
import PlatformIcon, { PLATFORM_COLORS, PLATFORM_LABELS } from "@/components/ui/PlatformIcon";

// ─── Auth ────────────────────────────────────────────────────────────────────
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── Configuración de plataformas ────────────────────────────────────────────
// TikTok tiene branding especial: negro en claro, blanco en oscuro.
// El resto usa su color de marca normal.
const PLATFORMS = [
  { key: "instagram", label: "Instagram", color: "var(--color-instagram)", textColor: "white" },
  { key: "tiktok",    label: "TikTok",    color: null,                     textColor: null    }, // especial
  { key: "youtube",   label: "YouTube",   color: "var(--color-youtube)",   textColor: "white" },
  { key: "twitch",    label: "Twitch",    color: "var(--color-twitch)",    textColor: "white" },
];

// Devuelve los colores reales de TikTok según el tema activo del documento.
function getTikTokStyle() {
  if (typeof document === "undefined") return { bg: "#000", text: "#fff", icon: "#fff" };
  const isDark = document.documentElement.dataset.theme === "dark";
  return isDark
    ? { bg: "#ffffff", text: "#000000", icon: "#000000" }  // oscuro → botón blanco
    : { bg: "#000000", text: "#ffffff", icon: "#ffffff" }; // claro  → botón negro
}

// Resuelve el color efectivo de una plataforma (con soporte TikTok especial).
function getPlatformColor(key, tiktokStyle) {
  if (key === "tiktok") return tiktokStyle.bg;
  return PLATFORMS.find((p) => p.key === key)?.color ?? "var(--color-accent)";
}

// Criterios de ordenación disponibles
const SORTS = [
  { key: "followers",  label: "Seguidores"  },
  { key: "engagement", label: "Engagement"  },
  { key: "growth",     label: "Crecimiento" },
  { key: "views",      label: "Visitas"     },
];

// Label del campo de seguidores según plataforma
const FOLLOWER_LABEL = {
  instagram: "Seguidores",
  tiktok:    "Seguidores",
  twitch:    "Seguidores",
  youtube:   "Suscriptores",
};

// ─── Posición estilo arcade (contorno + relleno, sin glow) ────────────
function Medal({ position }) {
  const STYLES = {
    1: { fill: "#FFD700", stroke: "#7A5800", size: "30px" },
    2: { fill: "#D8E0EC", stroke: "#505870", size: "26px" },
    3: { fill: "#D4895A", stroke: "#6B3A1F", size: "24px" },
  };

  const s = STYLES[position];
  if (!s) {
    return (
      <span style={{
        fontFamily: "'Courier New', monospace",
        fontSize: "13px",
        fontWeight: "600",
        color: "var(--color-muted)",
      }}>
        {position}
      </span>
    );
  }

  return (
    <span style={{
      fontFamily: "Impact, 'Arial Black', Arial, sans-serif",
      fontSize: s.size,
      fontWeight: "900",
      color: s.fill,
      WebkitTextStroke: `2px ${s.stroke}`,
      textStroke: `2px ${s.stroke}`,
      paintOrder: "stroke fill",
      lineHeight: 1,
      display: "block",
      userSelect: "none",
      letterSpacing: "-1px",
      padding: "2px 3px",
    }}>
      {position}
    </span>
  );
}

// ─── Avatar generado con inicial ─────────────────────────────────────────────
function Avatar({ username, color }) {
  const letter = (username || "?")[0].toUpperCase();
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
      style={{ background: color }}
    >
      {letter}
    </span>
  );
}

// ─── Badge de crecimiento ─────────────────────────────────────────────────────
function GrowthBadge({ value }) {
  if (value === null || value === undefined) {
    return (
      <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
        —
      </span>
    );
  }
  const num      = parseFloat(value);
  const positive = num >= 0;
  return (
    <span className={[
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
      positive
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        : "bg-[var(--color-error-soft)] text-[var(--color-error)]",
    ].join(" ")}>
      {positive ? "▲" : "▼"} {Math.abs(num).toFixed(2)}%
    </span>
  );
}

// ─── Skeleton de fila ─────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pr-4"><div className="skeleton h-5 w-6 rounded" /></td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      </td>
      <td className="py-3 pr-4"><div className="skeleton h-4 w-20 rounded" /></td>
      <td className="py-3 pr-4"><div className="skeleton h-4 w-16 rounded" /></td>
      <td className="py-3 pr-4"><div className="skeleton h-5 w-16 rounded-full" /></td>
      <td className="py-3"><div className="skeleton h-5 w-16 rounded-full" /></td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RankingsPage
// ─────────────────────────────────────────────────────────────────────────────
export default function RankingsPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [platform, setPlatform] = useState("instagram");
  const [sort,     setSort]     = useState("followers");
  const [ranking,  setRanking]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [theme,    setTheme]    = useState("dark"); // para detectar cambios de tema

  // Sincronizar tema con el atributo del documento
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme || "dark");
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  const tiktokStyle = getTikTokStyle();

  // Protección de ruta
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  // Cargar ranking al cambiar plataforma o criterio
  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await rankingApi.get(platform, sort);
      setRanking(data?.ranking || []);
    } catch (err) {
      setError(err.message || "Error al cargar el ranking");
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [platform, sort]);

  useEffect(() => {
    if (token) fetchRanking();
  }, [token, fetchRanking]);

  if (token === null) return null;

  const meta      = PLATFORMS.find((p) => p.key === platform);
  const isTikTok  = platform === "tiktok";
  // Color efectivo del panel/tabs para la plataforma activa
  const activeColor     = isTikTok ? tiktokStyle.bg   : meta.color;
  const activeTextColor = isTikTok ? tiktokStyle.text : "white";
  const activeIconColor = isTikTok ? tiktokStyle.icon : "white";

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
            Ranking
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Clasificación global de perfiles registrados por plataforma
          </p>
        </div>

        {/* ── Tabs de plataforma ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isActive  = platform === p.key;
            const isTT      = p.key === "tiktok";
            const btnBg     = isTT ? tiktokStyle.bg   : p.color;
            const btnText   = isTT ? tiktokStyle.text : "white";
            const btnIcon   = isTT ? tiktokStyle.icon : "white";
            const inactiveIconColor = isTT ? (theme === "dark" ? "#ffffff" : "#000000") : p.color;

            return (
              <button
                key={p.key}
                onClick={() => { setPlatform(p.key); setSort("followers"); }}
                className={[
                  "flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-transparent shadow-md"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
                ].join(" ")}
                style={isActive
                  ? { background: btnBg, color: btnText }
                  : {}
                }
              >
                <PlatformIcon
                  platform={p.key}
                  size={16}
                  color={isActive ? btnIcon : inactiveIconColor}
                />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* ── Panel principal ──────────────────────────────────────────── */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 backdrop-blur-xl">

          {/* Cabecera del panel: título + selector de criterio */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo de plataforma */}
              <PlatformIcon platform={platform} size={20} color={meta.color} />
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {meta.label}
              </h2>
              {!loading && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                  {ranking.length} {ranking.length === 1 ? "perfil" : "perfiles"}
                </span>
              )}
            </div>

            {/* Selector de criterio de ordenación */}
            <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 p-1">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={[
                    "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                    sort === s.key
                      ? "text-white shadow-sm"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                  ].join(" ")}
                  style={sort === s.key ? { background: meta.color } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
              {error}
            </p>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">#</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Perfil</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    {FOLLOWER_LABEL[platform]}
                  </th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Visitas</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Engagement</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Crecimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">

                {/* Skeletons mientras carga */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))}

                {/* Sin datos */}
                {!loading && ranking.length === 0 && !error && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-[var(--color-muted)]">
                      <div className="flex flex-col items-center gap-3">
                        <PlatformIcon platform={platform} size={40} color={meta.color} />
                        <p>Aún no hay perfiles de {meta.label} con estadísticas registradas.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Filas del ranking */}
                {!loading && ranking.map((entry, idx) => {
                  // Top 3 destacados con fondo suave
                  const isTop3 = entry.position <= 3;
                  const rowStyle = isTop3
                    ? { background: `${meta.color}0a` }
                    : undefined;

                  return (
                    <tr
                      key={entry.profileId}
                      className="transition-colors hover:bg-[var(--color-surface-strong)]/50"
                      style={{
                        ...rowStyle,
                        // Entrada escalonada
                        opacity:    1,
                        animation:  `fade-in 0.3s ease ${idx * 40}ms both`,
                      }}
                    >
                      {/* Posición + medalla */}
                      <td className="py-3.5 pr-6">
                        <div className="flex w-10 items-center justify-start overflow-visible">
                          <Medal position={entry.position} />
                        </div>
                      </td>

                      {/* Avatar + nombre + enlace */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar con badge de plataforma en esquina */}
                          <div className="relative shrink-0">
                            <Avatar username={entry.username} color={meta.color} />
                            <span
                              className="absolute -bottom-0.5 -right-0.5 grid h-[14px] w-[14px] place-items-center rounded-full"
                              style={{
                                border: `1.5px solid var(--color-surface)`,
                                background: "var(--color-surface-strong)",
                              }}
                            >
                              <PlatformIcon platform={platform} size={8} color={meta.color} />
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--color-text)]">
                              @{entry.username}
                            </p>
                            {entry.url && (
                              <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
                              >
                                {entry.url.replace(/^https?:\/\/(www\.)?/, "")}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Seguidores/Suscriptores */}
                      <td className="py-3.5 pr-4">
                        <span className={[
                          "font-semibold",
                          sort === "followers"
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-text-secondary)]",
                        ].join(" ")}>
                          {entry.followers.toLocaleString("es-ES")}
                        </span>
                      </td>

                      {/* Visitas */}
                      <td className="py-3.5 pr-4 text-[var(--color-text-secondary)]">
                        {entry.views.toLocaleString("es-ES")}
                      </td>

                      {/* Engagement */}
                      <td className="py-3.5 pr-4">
                        <span className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          sort === "engagement"
                            ? "bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]"
                            : "text-[var(--color-text-secondary)]",
                        ].join(" ")}>
                          {entry.engagement.toFixed(2)}%
                        </span>
                      </td>

                      {/* Crecimiento */}
                      <td className="py-3.5">
                        <GrowthBadge value={entry.growth} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Leyenda inferior */}
          {!loading && ranking.length > 0 && (
            <p className="mt-4 text-xs text-[var(--color-muted)]">
              Datos de la última semana registrada por cada perfil ·
              Ordenado por <strong className="text-[var(--color-text)]">{SORTS.find((s) => s.key === sort)?.label}</strong>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
