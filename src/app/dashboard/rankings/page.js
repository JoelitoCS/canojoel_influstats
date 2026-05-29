"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { rankingApi } from "@/lib/api";
import PlatformIcon, { PLATFORM_COLORS, PLATFORM_LABELS } from "@/components/ui/PlatformIcon";

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

const PLATFORMS = [
  { key: "instagram", label: "Instagram", color: "var(--color-instagram)" },
  { key: "tiktok",    label: "TikTok",    color: null },
  { key: "youtube",   label: "YouTube",   color: "var(--color-youtube)" },
  { key: "twitch",    label: "Twitch",    color: "var(--color-twitch)" },
];

function getTikTokStyle() {
  if (typeof document === "undefined") return { bg: "#050506", text: "#ffffff", icon: "#ffffff" };
  const isDark = document.documentElement.dataset.theme === "dark";
  return isDark
    ? { bg: "#050506", text: "#ffffff", icon: "#ffffff" }
    : { bg: "#ffffff", text: "#000000", icon: "#000000" };
}

const SORTS = [
  { key: "followers",  label: "Seguidores"  },
  { key: "engagement", label: "Engagement"  },
  { key: "growth",     label: "Crecimiento" },
  { key: "views",      label: "Visitas"     },
];

const FOLLOWER_LABEL = {
  instagram: "Seguidores", tiktok: "Seguidores",
  twitch: "Seguidores",    youtube: "Suscriptores",
};

/* ── Medalla arcade ──────────────────────────────────────────────────────── */
function Medal({ position }) {
  const STYLES = {
    1: { fill: "#FFD700", stroke: "#7A5800", size: "30px" },
    2: { fill: "#D8E0EC", stroke: "#505870", size: "26px" },
    3: { fill: "#D4895A", stroke: "#6B3A1F", size: "24px" },
  };
  const s = STYLES[position];
  if (!s) return (
    <span style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", fontWeight: "600", color: "var(--color-muted)" }}>
      {position}
    </span>
  );
  return (
    <span style={{
      fontFamily: "Impact, 'Arial Black', Arial, sans-serif",
      fontSize: s.size, fontWeight: "900", color: s.fill,
      WebkitTextStroke: `2px ${s.stroke}`, textStroke: `2px ${s.stroke}`,
      paintOrder: "stroke fill", lineHeight: 1, display: "block",
      userSelect: "none", letterSpacing: "-1px", padding: "2px 3px",
    }}>
      {position}
    </span>
  );
}

function Avatar({ username, avatarUrl, color, onClick }) {
  const letter = (username || "?")[0].toUpperCase();
  const [imgError, setImgError] = useState(false);

  const content = avatarUrl && !imgError ? (
    <img
      src={avatarUrl}
      alt={`Avatar de @${username}`}
      onError={() => setImgError(true)}
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="text-sm font-bold text-white" style={{ lineHeight: 1 }}>{letter}</span>
  );

  const base = "grid h-10 w-10 shrink-0 place-items-center rounded-full overflow-hidden transition-all duration-200";
  const interactive = onClick ? "cursor-pointer ring-2 ring-transparent hover:ring-[var(--color-accent)] hover:scale-110 hover:shadow-lg" : "";

  return (
    <span
      className={`${base} ${interactive}`}
      style={{ background: (!avatarUrl || imgError) ? color : undefined }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      title={onClick ? `Ver perfil de @${username}` : undefined}
    >
      {content}
    </span>
  );
}

function GrowthBadge({ value }) {
  if (value === null || value === undefined) {
    return <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">—</span>;
  }
  const num = parseFloat(value);
  const pos = num >= 0;
  return (
    <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", pos ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-error-soft)] text-[var(--color-error)]"].join(" ")}>
      {pos ? "▲" : "▼"} {Math.abs(num).toFixed(2)}%
    </span>
  );
}

/* ── Skeleton de fila de tabla ───────────────────────────────────────────── */
function RowSkeleton() {
  return (
    <tr>
      <td className="py-3 pr-3"><div className="skeleton h-5 w-6 rounded" /></td>
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="skeleton h-9 w-9 rounded-full shrink-0" />
          <div className="skeleton h-4 w-20 rounded sm:w-28" />
        </div>
      </td>
      <td className="py-3 pr-3"><div className="skeleton h-4 w-16 rounded" /></td>
      {/* Las últimas 3 columnas se ocultan en móvil */}
      <td className="py-3 pr-3 hidden md:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
      <td className="py-3 pr-3 hidden sm:table-cell"><div className="skeleton h-5 w-16 rounded-full" /></td>
      <td className="py-3          hidden sm:table-cell"><div className="skeleton h-5 w-16 rounded-full" /></td>
    </tr>
  );
}

/* ── Card de entrada para móvil ──────────────────────────────────────────── */
function RankingCard({ entry, meta, sort, onAvatarClick }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      {/* Posición */}
      <div className="flex w-9 shrink-0 items-center justify-center pt-0.5">
        <Medal position={entry.position} />
      </div>

      {/* Avatar + datos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <Avatar
              username={entry.username}
              avatarUrl={entry.avatarUrl}
              color={meta.color || "#635bff"}
              onClick={onAvatarClick}
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-[14px] w-[14px] place-items-center rounded-full"
              style={{ border: "1.5px solid var(--color-surface)", background: "var(--color-surface-strong)" }}
            >
              <PlatformIcon platform={meta.key} size={8} color={meta.color || "#635bff"} />
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">@{entry.username}</p>
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noopener noreferrer"
                className="truncate text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                {entry.url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
          </div>
        </div>

        {/* Métricas en grid 2×2 compacto */}
        <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{FOLLOWER_LABEL[meta.key]}</p>
            <p className={["text-sm font-bold tabular-nums", sort === "followers" ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"].join(" ")}>
              {entry.followers.toLocaleString("es-ES")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Visitas</p>
            <p className="text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {entry.views.toLocaleString("es-ES")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Engagement</p>
            <span className={["rounded-full px-2 py-0.5 text-xs font-semibold", sort === "engagement" ? "bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]" : "text-[var(--color-text-secondary)]"].join(" ")}>
              {entry.engagement.toFixed(2)}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">Crecimiento</p>
            <GrowthBadge value={entry.growth} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RankingsPage
   ─────────────────────────────────────────────────────────────────────────
   Layout responsivo:
     < sm  (640px)  : cards apiladas (sin tabla)
     ≥ sm  (640px)  : tabla con 5 columnas (sin "Visitas" en sm)
     ≥ md  (768px)  : tabla completa con 6 columnas
   ═══════════════════════════════════════════════════════════════════════════ */
export default function RankingsPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [platform, setPlatform] = useState("instagram");
  const [sort,     setSort]     = useState("followers");
  const [ranking,  setRanking]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [theme,    setTheme]    = useState("dark");

  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme || "dark");
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  const tiktokStyle = getTikTokStyle();

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const data = await rankingApi.get(platform, sort);
      setRanking(data?.ranking || []);
    } catch (err) {
      setError(err.message || "Error al cargar el ranking"); setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [platform, sort]);

  useEffect(() => { if (token) fetchRanking(); }, [token, fetchRanking]);

  if (token === null) return null;

  const meta     = PLATFORMS.find((p) => p.key === platform);
  const isTikTok = platform === "tiktok";
  const activeColor     = isTikTok ? tiktokStyle.bg   : meta.color;
  const activeTextColor = isTikTok ? tiktokStyle.text : "white";
  const activeIconColor = isTikTok ? tiktokStyle.icon : "white";

  return (
    <AppShell>
      <div className="grid gap-5 animate-fade-in">

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl lg:text-4xl">
            Ranking
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Clasificación global de perfiles registrados por plataforma
          </p>
        </div>

        {/* ── Tabs de plataforma ───────────────────────────────────────── */}
        {/*
          flex-wrap: en móvil muy estrecho los botones se envuelven.
          En móvil mostramos solo el icono + label corto; en sm+ el label completo.
        */}
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
                  /* Altura mínima 44px para área táctil */
                  "flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold transition-all duration-200 min-h-[44px]",
                  "sm:px-4",
                  isActive ? "border-transparent shadow-md" : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]",
                ].join(" ")}
                style={isActive ? { background: btnBg, color: btnText } : {}}
              >
                <PlatformIcon platform={p.key} size={16} color={isActive ? btnIcon : inactiveIconColor} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Panel principal ──────────────────────────────────────────── */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 backdrop-blur-xl sm:p-6">

          {/* Cabecera del panel: título + selector de criterio */}
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <PlatformIcon platform={platform} size={20} color={meta.color || "var(--color-accent)"} />
              <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">{meta.label}</h2>
              {!loading && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                  {ranking.length} {ranking.length === 1 ? "perfil" : "perfiles"}
                </span>
              )}
            </div>

            {/* Selector de criterio — scroll horizontal en móvil muy estrecho */}
            <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 p-1 overflow-x-auto max-w-full">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={[
                    "rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                    "sm:px-3",
                    sort === s.key ? "text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                  ].join(" ")}
                  style={sort === s.key ? { background: meta.color || "var(--color-accent)" } : {}}
                >
                  {/* En móvil muy estrecho acortamos las etiquetas */}
                  <span className="hidden xs:inline">{s.label}</span>
                  <span className="xs:hidden">
                    {s.key === "followers" ? "Seg." : s.key === "engagement" ? "Eng." : s.key === "growth" ? "Crec." : "Visit."}
                  </span>
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

          {/* ── VISTA TABLA (≥ sm) + VISTA CARDS (< sm) ─────────────────
              En pantallas pequeñas (< 640px) una tabla con 6 columnas
              resulta ilegible. Usamos cards apiladas en su lugar.
              En ≥ sm mostramos la tabla con scroll horizontal si es necesario.
          ─────────────────────────────────────────────────────────────── */}

          {/* CARDS (visible solo en < sm) */}
          <div className="flex flex-col gap-3 sm:hidden">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}

            {!loading && ranking.length === 0 && !error && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <PlatformIcon platform={platform} size={36} color={meta.color || "var(--color-accent)"} />
                <p className="text-sm text-[var(--color-muted)]">Aún no hay perfiles de {meta.label} con estadísticas.</p>
              </div>
            )}

            {!loading && ranking.map((entry) => (
              <RankingCard
                key={entry.profileId}
                entry={entry}
                meta={meta}
                sort={sort}
                onAvatarClick={
                  entry.userProfileUsername
                    ? () => router.push(`/dashboard/profile/${entry.userProfileUsername}`)
                    : undefined
                }
              />
            ))}
          </div>

          {/* TABLA (visible desde sm en adelante) */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[540px] px-4 sm:px-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left">
                      <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">#</th>
                      <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Perfil</th>
                      <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">{FOLLOWER_LABEL[platform]}</th>
                      <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] hidden md:table-cell">Visitas</th>
                      <th className="pb-3 pr-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Engagement</th>
                      <th className="pb-3      text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {loading && Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}

                    {!loading && ranking.length === 0 && !error && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-sm text-[var(--color-muted)]">
                          <div className="flex flex-col items-center gap-3">
                            <PlatformIcon platform={platform} size={40} color={meta.color || "var(--color-accent)"} />
                            <p>Aún no hay perfiles de {meta.label} con estadísticas registradas.</p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && ranking.map((entry, idx) => {
                      const isTop3    = entry.position <= 3;
                      const rowStyle  = isTop3 ? { background: `${meta.color || "#635bff"}0a` } : undefined;
                      return (
                        <tr
                          key={entry.profileId}
                          className="transition-colors hover:bg-[var(--color-surface-strong)]/50"
                          style={{ ...rowStyle, animation: `fade-in 0.3s ease ${idx * 40}ms both` }}
                        >
                          <td className="py-3.5 pr-4">
                            <div className="flex w-10 items-center justify-start overflow-visible">
                              <Medal position={entry.position} />
                            </div>
                          </td>

                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="relative shrink-0">
                                <Avatar
                                  username={entry.username}
                                  avatarUrl={entry.avatarUrl}
                                  color={meta.color || "#635bff"}
                                  onClick={
                                    entry.userProfileUsername
                                      ? () => router.push(`/dashboard/profile/${entry.userProfileUsername}`)
                                      : undefined
                                  }
                                />
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 grid h-[14px] w-[14px] place-items-center rounded-full"
                                  style={{ border: "1.5px solid var(--color-surface)", background: "var(--color-surface-strong)" }}
                                >
                                  <PlatformIcon platform={platform} size={8} color={meta.color || "#635bff"} />
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={["truncate font-semibold text-[var(--color-text)]", entry.userProfileUsername ? "cursor-pointer hover:text-[var(--color-accent)] transition-colors" : ""].join(" ")}
                                  onClick={entry.userProfileUsername ? () => router.push(`/dashboard/profile/${entry.userProfileUsername}`) : undefined}
                                  title={entry.userProfileUsername ? `Ver perfil de @${entry.username}` : undefined}
                                >
                                  @{entry.username}
                                </p>
                                {entry.url && (
                                  <a href={entry.url} target="_blank" rel="noopener noreferrer"
                                    className="hidden truncate text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] md:block">
                                    {entry.url.replace(/^https?:\/\/(www\.)?/, "")}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 pr-3">
                            <span className={["font-semibold tabular-nums", sort === "followers" ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"].join(" ")}>
                              {entry.followers.toLocaleString("es-ES")}
                            </span>
                          </td>

                          {/* Visitas: oculta en sm, visible desde md */}
                          <td className="py-3.5 pr-3 text-[var(--color-text-secondary)] hidden md:table-cell tabular-nums">
                            {entry.views.toLocaleString("es-ES")}
                          </td>

                          <td className="py-3.5 pr-3">
                            <span className={["rounded-full px-2 py-0.5 text-xs font-semibold", sort === "engagement" ? "bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]" : "text-[var(--color-text-secondary)]"].join(" ")}>
                              {entry.engagement.toFixed(2)}%
                            </span>
                          </td>

                          <td className="py-3.5">
                            <GrowthBadge value={entry.growth} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {!loading && ranking.length > 0 && (
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                Datos de la última semana registrada · Ordenado por <strong className="text-[var(--color-text)]">{SORTS.find((s) => s.key === sort)?.label}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
