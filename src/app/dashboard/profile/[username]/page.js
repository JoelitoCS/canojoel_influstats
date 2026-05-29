"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/app/dashboard/profile/[username]/page.js
//  Vista pública/privada de perfil de usuario
//  - Header: avatar, nombre, bio, redes sociales
//  - Estadísticas con tarjetas
//  - Gráficos históricos con leyenda, tooltips y ejes claros
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import AppShell from "@/components/layout/AppShell";
import { getPublicProfile, getMyProfile } from "@/lib/userProfileApi";

// ── Iconos de redes sociales ───────────────────────────────────────────────
const SOCIAL_ICONS = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/>
    </svg>
  ),
  twitch: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/>
    </svg>
  ),
  discord: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.014.043.03.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  ),
  github: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
    </svg>
  ),
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  website: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20M2 12h20"/>
    </svg>
  ),
};

const SOCIAL_COLORS = {
  instagram: "#e1306c", twitter: "#1da1f2",
  youtube:   "#ff2222", twitch:  "#7c3aed", discord:  "#5865f2",
  github:    "#333",    linkedin: "#0077b5", website:  "#635bff",
};

// TikTok no está en SOCIAL_COLORS porque su color depende del tema (ver useTikTokColor)

// Colores para los gráficos por plataforma (TikTok se inyecta dinámicamente)
const PLATFORM_CHART_COLORS = {
  instagram: { followers: "#e1306c", views: "#f06292", engagement: "#ad1457", growth: "#ec407a" },
  youtube:   { followers: "#ff2222", views: "#ff7043", engagement: "#e53935", growth: "#ef5350" },
  twitch:    { followers: "#7c3aed", views: "#9c27b0", engagement: "#6a1b9a", growth: "#8e24aa" },
  default:   { followers: "#635bff", views: "#06b6d4", engagement: "#10b981", growth: "#f59e0b" },
};

/** Hook que devuelve el color de TikTok reactivo al tema claro/oscuro.
 *  Oscuro → blanco (#ffffff)   Claro → negro (#010101) */
function useTikTokColor() {
  const [color, setColor] = useState(() => {
    if (typeof document === "undefined") return "#ffffff";
    return document.documentElement.dataset.theme === "light" ? "#010101" : "#ffffff";
  });
  useEffect(() => {
    const update = () => {
      const theme = document.documentElement.dataset.theme || "dark";
      setColor(theme === "light" ? "#010101" : "#ffffff");
    };
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);
  return color;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("es-ES");
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch { return dateStr; }
}

// ── Componentes ───────────────────────────────────────────────────────────────
function AvatarDisplay({ url, username, size = 88 }) {
  if (url) return (
    <img src={url} alt={username}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
        border: "3px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}
    />
  );
  const letter = (username || "U").charAt(0).toUpperCase();
  const colorOptions = ["#635bff","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];
  const color = colorOptions[letter.charCodeAt(0) % colorOptions.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: `${color}22`, border: `3px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color,
      boxShadow: "var(--shadow-card)" }}>
      {letter}
    </div>
  );
}

function StatCard({ label, value, sub, color = "var(--color-accent)" }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)", padding: "14px 16px",
      borderTop: `3px solid ${color}`, minWidth: 0 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-muted)",
        textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.2 }}>
        {value ?? "—"}
      </p>
      {sub && (
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-muted)" }}>{sub}</p>
      )}
    </div>
  );
}

// ── Tooltip personalizado para los gráficos ──────────────────────────────────
function CustomTooltip({ active, payload, label, platform }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "var(--color-surface-strong)", border: "1px solid var(--color-border-strong)",
      borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13,
      boxShadow: "var(--shadow-card-hover)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--color-text)", fontSize: 12,
        borderBottom: "1px solid var(--color-border)", paddingBottom: 6 }}>
        📅 {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
          <span style={{ color: "var(--color-text-secondary)", flex: 1 }}>{entry.name}:</span>
          <span style={{ fontWeight: 700, color: entry.color }}>
            {entry.dataKey === "engagement" || entry.dataKey === "growth"
              ? `${Number(entry.value).toFixed(2)}%`
              : fmt(entry.value)
            }
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Gráfico por plataforma ────────────────────────────────────────────────────
function PlatformChart({ stat, historyData }) {
  const [chartType, setChartType] = useState("followers"); // followers | engagement | views | growth
  const tikTokColor = useTikTokColor();
  const tikTokColors = { followers: tikTokColor, views: tikTokColor, engagement: tikTokColor, growth: tikTokColor };
  const colors = stat.platform === "tiktok" ? tikTokColors : (PLATFORM_CHART_COLORS[stat.platform] || PLATFORM_CHART_COLORS.default);

  // Preparar datos del gráfico desde historyData o generar datos de demo si no hay
  const chartData = historyData && historyData.length > 0
    ? historyData.map((h) => ({
        date:       fmtDate(h.weekDate),
        followers:  h.followers ?? 0,
        views:      h.views ?? 0,
        engagement: Number(h.engagement ?? 0),
        growth:     h.growth !== null ? Number(h.growth) : null,
      }))
    : [];

  const chartTabs = [
    { id: "followers",  label: "Seguidores", color: colors.followers,  desc: "Número total de seguidores" },
    { id: "views",      label: "Vistas",     color: colors.views,      desc: "Reproducciones / visitas" },
    { id: "engagement", label: "Engagement", color: colors.engagement, desc: "Tasa de interacción (%)" },
    { id: "growth",     label: "Crecimiento",color: colors.growth,     desc: "Crecimiento semanal (%)" },
  ];

  const activeTab = chartTabs.find((t) => t.id === chartType);
  const isPercent = chartType === "engagement" || chartType === "growth";

  if (chartData.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "var(--color-muted)", fontSize: 14 }}>
        No hay datos históricos para mostrar gráficos.
      </div>
    );
  }

  return (
    <div>
      {/* Selector de métrica */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {chartTabs.map((tab) => (
          <button key={tab.id} onClick={() => setChartType(tab.id)}
            style={{
              padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid",
              borderColor: chartType === tab.id ? tab.color : "var(--color-border)",
              background:  chartType === tab.id ? `${tab.color}18` : "var(--color-surface-strong)",
              color:       chartType === tab.id ? tab.color        : "var(--color-text-secondary)",
              fontSize: 12, fontWeight: chartType === tab.id ? 700 : 500,
              cursor: "pointer", transition: "all 0.15s",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Descripción de la métrica activa */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: activeTab?.color }} />
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          <strong style={{ color: activeTab?.color }}>{activeTab?.label}</strong>
          {" — "}{activeTab?.desc}
        </span>
      </div>

      {/* Gráfico */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${stat.platform}-${chartType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={activeTab?.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={activeTab?.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => isPercent ? `${v}%` : fmt(v)}
              width={52}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} platform={stat.platform} />}
            />
            <Area
              type="monotone"
              dataKey={chartType}
              name={activeTab?.label}
              stroke={activeTab?.color}
              strokeWidth={2.5}
              fill={`url(#gradient-${stat.platform}-${chartType})`}
              dot={false}
              activeDot={{ r: 5, fill: activeTab?.color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Gráfico comparativo multi-plataforma ─────────────────────────────────────
function MultiPlatformChart({ stats }) {
  const [metric, setMetric] = useState("engagement");

  if (!stats || stats.length < 2) return null;

  // Datos: una fila por semana, una columna por plataforma
  // Tomamos la última semana de cada plataforma (datos actuales)
  const data = [
    {
      name: "Actual",
      ...Object.fromEntries(
        stats.map((s) => [s.platform, Number(s[metric] ?? s.engagement ?? 0)])
      ),
    },
  ];

  const colors = ["#635bff","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];
  const metrics = [
    { id: "engagement", label: "Engagement (%)" },
    { id: "followers",  label: "Seguidores" },
    { id: "views",      label: "Vistas" },
  ];

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
          Comparativa de plataformas
        </h3>
        <div style={{ display: "flex", gap: 4 }}>
          {metrics.map((m) => (
            <button key={m.id} onClick={() => setMetric(m.id)}
              style={{ padding: "4px 12px", borderRadius: "var(--radius-xs)", border: "1px solid",
                borderColor: metric === m.id ? "var(--color-accent)" : "var(--color-border)",
                background:  metric === m.id ? "var(--color-accent-soft)" : "transparent",
                color:       metric === m.id ? "var(--color-accent)"      : "var(--color-muted)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leyenda visual de plataformas */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {stats.map((s, i) => (
          <div key={s.platform} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i % colors.length] }} />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>
              {s.platform} (@{s.username})
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-muted)" }} tickLine={false} axisLine={false}
              tickFormatter={(v) => metric === "engagement" ? `${v}%` : fmt(v)} width={50} />
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{value}</span>
              )}
            />
            {stats.map((s, i) => (
              <Line key={s.platform} type="monotone" dataKey={s.platform}
                name={`${s.platform} @${s.username}`}
                stroke={colors[i % colors.length]} strokeWidth={2.5}
                dot={{ r: 5, fill: colors[i % colors.length], strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Botón para volver a Explorar (chevron animado + acento violeta v3)
// ═══════════════════════════════════════════════════════════════════════════════
function BackToExploreButton({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Volver a Explorar"
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "8px 16px 8px 10px",
        marginBottom: 16,
        background: hover ? "var(--color-accent-soft)" : "var(--color-surface)",
        border: `1px solid ${hover ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "999px",
        color: hover ? "var(--color-accent)" : "var(--color-text)",
        fontSize: 14, fontWeight: 600,
        cursor: "pointer",
        boxShadow: hover ? "0 6px 18px -6px var(--color-accent)55" : "var(--shadow-card)",
        transform: hover ? "translateX(-2px)" : "translateX(0)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: "50%",
        background: hover ? "var(--color-accent)" : "var(--color-bg)",
        color: hover ? "#fff" : "var(--color-accent)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hover ? "translateX(-3px)" : "translateX(0)",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </span>
      <span>Volver a Explorar</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Página principal
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const username = params.username;

  const tikTokColor = useTikTokColor();

  const [profile,      setProfile]      = useState(null);
  const [rankPosition, setRankPosition] = useState(null);
  const [isOwner,      setIsOwner]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);

    const fetchFn = username === "me"
      ? () => getMyProfile().then((d) => ({ profile: d.profile, isOwner: true, rankPosition: null }))
      : () => getPublicProfile(username);

    fetchFn()
      .then((data) => {
        if (username === "me" && data.profile?.username) {
          router.replace(`/dashboard/profile/${data.profile.username}`);
          return;
        }
        setProfile(data.profile);
        setRankPosition(data.rankPosition);
        setIsOwner(data.isOwner || false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username, router]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {[300, 200, 200].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: "var(--radius-lg)", marginBottom: 16 }} />
        ))}
      </div>
    </AppShell>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    const isNoProfile = error.toLowerCase().includes("no encontrado") ||
                        error.toLowerCase().includes("créalo") ||
                        error.toLowerCase().includes("not found");
    const isOwnProfile = username === "me";

    return (
      <AppShell>
        <div style={{ textAlign: "center", padding: "80px 24px", maxWidth: 460, margin: "0 auto" }}>

          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
            background: "var(--color-accent-soft)", border: "2px solid var(--color-accent)44",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
          }}>
            {isNoProfile && isOwnProfile ? "✨" : "🔒"}
          </div>

          <h2 style={{ color: "var(--color-text)", margin: "0 0 10px", fontSize: 22, fontWeight: 800 }}>
            {isNoProfile && isOwnProfile ? "Aún no tienes perfil" : error}
          </h2>

          <p style={{ color: "var(--color-muted)", marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
            {isNoProfile && isOwnProfile
              ? "Crea tu perfil público para aparecer en búsquedas, explorar y rankings. Solo tarda un minuto."
              : "Este perfil puede ser privado o no existir."}
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {isNoProfile && isOwnProfile ? (
              <Link href="/dashboard/profile/edit"
                style={{
                  padding: "12px 28px", borderRadius: "var(--radius-md)", border: "none",
                  background: "var(--color-accent)", color: "white",
                  fontSize: 14, fontWeight: 700, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 14px var(--color-accent-glow)",
                }}
              >
                ✏️ Crear mi perfil
              </Link>
            ) : (
              <button onClick={() => router.back()}
                style={{
                  padding: "12px 28px", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)", color: "var(--color-text)",
                  cursor: "pointer", fontSize: 14, fontWeight: 500,
                }}>
                ← Volver
              </button>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) return null;

  const publicLinks = (profile.socialLinks || []).filter((l) => l.isPublic !== false && l.isActive !== false);
  const stats       = profile.stats || [];

  return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Botón volver a Explorar ──────────────────────────────────── */}
        <BackToExploreButton
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard/explore");
            }
          }}
        />

        {/* ── Header del perfil ────────────────────────────────────────── */}
        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)", padding: "28px", marginBottom: 20,
          boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <AvatarDisplay url={profile.avatarUrl} username={profile.username} size={92} />
              {rankPosition && rankPosition <= 3 && (
                <div style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 28, height: 28, borderRadius: "50%",
                  background: rankPosition === 1 ? "#FFD700" : rankPosition === 2 ? "#C0C0C0" : "#CD7F32",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, border: "2px solid var(--color-surface)",
                  boxShadow: "var(--shadow-card)",
                }}>
                  {rankPosition === 1 ? "🥇" : rankPosition === 2 ? "🥈" : "🥉"}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--color-text)" }}>
                  {profile.displayName || `@${profile.username}`}
                </h1>
                {rankPosition && (
                  <span style={{
                    padding: "3px 10px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700,
                    background: "var(--color-accent-soft)", color: "var(--color-accent)",
                    border: "1px solid var(--color-accent)44",
                  }}>
                    #{rankPosition} Ranking
                  </span>
                )}
                {!profile.isPublic && (
                  <span style={{
                    padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, fontWeight: 600,
                    background: "var(--color-warning-soft)", color: "var(--color-warning)",
                  }}>
                    🔒 Privado
                  </span>
                )}
              </div>

              <p style={{ margin: "0 0 6px", fontSize: 14, color: "var(--color-muted)" }}>
                @{profile.username}
                {profile.country && (
                  <span style={{ marginLeft: 8 }}>📍 {profile.country}</span>
                )}
              </p>

              {profile.shortBio && (
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)" }}>
                  {profile.shortBio}
                </p>
              )}

              {profile.bio && (
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: 460 }}>
                  {profile.bio}
                </p>
              )}

              <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>
                🗓 Miembro desde {new Date(profile.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}
              </p>
            </div>

            {/* Botón editar (solo propietario) */}
            {isOwner && (
              <Link href="/dashboard/profile/edit"
                style={{
                  padding: "9px 18px", borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-accent)",
                  background: "var(--color-accent-soft)", color: "var(--color-accent)",
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                ✏️ Editar perfil
              </Link>
            )}
          </div>

          {/* Redes sociales públicas */}
          {publicLinks.length > 0 && (
            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap",
              marginTop: 20, paddingTop: 18,
              borderTop: "1px solid var(--color-border)",
            }}>
              {publicLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-surface-strong)", color: "var(--color-text-secondary)",
                    fontSize: 13, textDecoration: "none", transition: "all 0.15s",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    const color = SOCIAL_COLORS[link.platform] || "#635bff";
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.color       = color;
                    e.currentTarget.style.background  = `${color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color       = "var(--color-text-secondary)";
                    e.currentTarget.style.background  = "var(--color-surface-strong)";
                  }}
                >
                  <span style={{ color: link.platform === "tiktok" ? tikTokColor : (SOCIAL_COLORS[link.platform] || "var(--color-accent)") }}>
                    {SOCIAL_ICONS[link.platform] || SOCIAL_ICONS.website}
                  </span>
                  {link.label || link.platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Resumen de stats (tarjetas) ──────────────────────────────── */}
        {stats.length > 0 && (
          <>
            {/* Comparativa multi-plataforma (si hay 2+) */}
            {stats.length >= 2 && <MultiPlatformChart stats={stats} />}

            {/* Detalle por plataforma */}
            {stats.map((s) => {
              const tikTokColors = { followers: tikTokColor, views: tikTokColor, engagement: tikTokColor, growth: tikTokColor };
              const colors = s.platform === "tiktok" ? tikTokColors : (PLATFORM_CHART_COLORS[s.platform] || PLATFORM_CHART_COLORS.default);
              return (
                <div key={`${s.platform}-${s.username}`}
                  style={{
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)", padding: "20px 22px", marginBottom: 16,
                    boxShadow: "var(--shadow-card)",
                  }}>
                  {/* Cabecera de plataforma */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
                      padding: "4px 10px", borderRadius: "var(--radius-xs)",
                      background: `${colors.followers}18`, color: colors.followers,
                      border: `1px solid ${colors.followers}40`,
                    }}>
                      {s.platform}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--color-muted)" }}>@{s.username}</span>
                    {s.weekDate && (
                      <span style={{ fontSize: 11, color: "var(--color-muted)", marginLeft: "auto" }}>
                        Última actualización: semana del {new Date(s.weekDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Tarjetas de métricas */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                    <StatCard label="Seguidores"  value={fmt(s.followers)}  color={colors.followers}  sub="Total acumulado" />
                    <StatCard label="Vistas"       value={fmt(s.views)}      color={colors.views}      sub="Esta semana" />
                    <StatCard label="Engagement"   value={s.engagement !== null ? `${Number(s.engagement).toFixed(2)}%` : null} color={colors.engagement} sub="Tasa interacción" />
                    {s.growth !== null && (
                      <StatCard
                        label="Crecimiento"
                        value={`${Number(s.growth) >= 0 ? "+" : ""}${Number(s.growth).toFixed(2)}%`}
                        color={Number(s.growth) >= 0 ? "var(--color-success)" : "var(--color-error)"}
                        sub="vs semana anterior"
                      />
                    )}
                  </div>

                  {/* Separador */}
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16, marginBottom: 4 }}>
                    <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                      📈 Evolución histórica
                    </p>
                    <PlatformChart stat={s} historyData={s.history || []} />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Sin estadísticas */}
        {stats.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 0",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
            <p style={{ margin: 0, color: "var(--color-text)", fontSize: 16, fontWeight: 600 }}>
              Sin estadísticas aún
            </p>
            <p style={{ margin: "6px 0 0", color: "var(--color-muted)", fontSize: 14 }}>
              {isOwner
                ? "Añade tus perfiles sociales para empezar a ver tus métricas aquí."
                : "Este usuario aún no tiene estadísticas registradas."}
            </p>
            {isOwner && (
              <Link href="/dashboard" style={{
                display: "inline-block", marginTop: 16, padding: "10px 22px",
                borderRadius: "var(--radius-md)", background: "var(--color-accent)",
                color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                Ir al Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
