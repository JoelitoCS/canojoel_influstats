"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PlatformPage from "@/components/ui/PlatformPage";
import PlatformIcon from "@/components/ui/PlatformIcon";
import { profilesApi, metricsApi } from "@/lib/api";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── Config de plataformas ────────────────────────────────────────────────────
const PLATFORMS = [
  {
    key: "instagram", label: "Instagram", color: "var(--color-instagram)",
    growthField: "followers",
    chartFields: [
      { key: "followers", label: "Seguidores"      },
      { key: "views",     label: "Visualizaciones" },
      { key: "likes",     label: "Likes"           },
      { key: "favorites", label: "Guardados"       },
      { key: "posts",     label: "Publicaciones"   },
    ],
  },
  {
    key: "tiktok", label: "TikTok", color: "var(--color-tiktok)",
    growthField: "followers",
    chartFields: [
      { key: "followers", label: "Seguidores"  },
      { key: "views",     label: "Visitas"     },
      { key: "likes",     label: "Likes"       },
      { key: "comments",  label: "Comentarios" },
      { key: "favorites", label: "Favoritos"   },
      { key: "shares",    label: "Compartidos" },
    ],
  },
  {
    key: "youtube", label: "YouTube", color: "var(--color-youtube)",
    growthField: "subscribers",
    chartFields: [
      { key: "subscribers", label: "Suscriptores"     },
      { key: "views",       label: "Visitas"          },
      { key: "likes",       label: "Likes"            },
      { key: "paidMembers", label: "Miembros de pago" },
    ],
  },
  {
    key: "twitch", label: "Twitch", color: "var(--color-twitch)",
    growthField: "followers",
    chartFields: [
      { key: "followers",         label: "Seguidores"      },
      { key: "views",             label: "Visualizaciones" },
      { key: "subscribersTwitch", label: "Suscriptores"    },
      { key: "bits",              label: "Bits donados"    },
    ],
  },
];

// Cuántos perfiles por plataforma antes de colapsar a <select>
const PILL_LIMIT = 5;

// ─────────────────────────────────────────────────────────────────────────────
//  PlataformasPage
// ─────────────────────────────────────────────────────────────────────────────
export default function PlataformasPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const initialTab = PLATFORMS.find((p) => p.key === searchParams.get("tab"))?.key ?? "instagram";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [period,    setPeriod]    = useState("month");
  const prevTabRef  = useRef(initialTab);

  // cache[platformKey] = { profiles: [], selectedId: null, history: [], loading: true }
  const [cache, setCache] = useState(() =>
    Object.fromEntries(PLATFORMS.map((p) => [
      p.key,
      { profiles: undefined, selectedId: null, history: [], loading: true },
    ]))
  );

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  // ── Cargar perfiles de una plataforma ────────────────────────────────────
  const loadPlatform = useCallback(async (platformKey) => {
    // No recargar si ya tenemos datos
    setCache((prev) => {
      if (prev[platformKey].profiles !== undefined) return prev;
      return { ...prev, [platformKey]: { ...prev[platformKey], loading: true } };
    });

    try {
      const data  = await profilesApi.getAll();
      const list  = Array.isArray(data) ? data : data?.profiles || [];
      const profs = list.filter((p) => p.platform?.toLowerCase() === platformKey);

      // Cargar métricas del primer perfil si existe
      let history = [];
      const firstId = profs[0]?.id || null;
      if (firstId) {
        const m = await metricsApi.getAll(firstId);
        history = m?.metrics || [];
      }

      setCache((prev) => ({
        ...prev,
        [platformKey]: { profiles: profs, selectedId: firstId, history, loading: false },
      }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [platformKey]: { profiles: [], selectedId: null, history: [], loading: false },
      }));
    }
  }, []);

  // ── Cambiar el perfil seleccionado dentro de una plataforma ─────────────
  const handleSelectProfile = useCallback(async (platformKey, profileId) => {
    setCache((prev) => ({
      ...prev,
      [platformKey]: { ...prev[platformKey], selectedId: profileId, loading: true },
    }));
    try {
      const m = await metricsApi.getAll(profileId);
      setCache((prev) => ({
        ...prev,
        [platformKey]: { ...prev[platformKey], history: m?.metrics || [], loading: false },
      }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [platformKey]: { ...prev[platformKey], history: [], loading: false },
      }));
    }
  }, []);

  // ── Cargar plataforma activa al montar y al cambiar ──────────────────────
  useEffect(() => {
    if (token) loadPlatform(activeTab);
  }, [token, activeTab, loadPlatform]);

  // ── Cambiar de tab con animación ─────────────────────────────────────────
  const handleTabChange = (key) => {
    if (key === activeTab || animating) return;
    const prevIdx = PLATFORMS.findIndex((p) => p.key === prevTabRef.current);
    const nextIdx = PLATFORMS.findIndex((p) => p.key === key);
    setDirection(nextIdx > prevIdx ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      prevTabRef.current = key;
      setActiveTab(key);
      setPeriod("month");
      setAnimating(false);
      // Precargar adyacentes
      [nextIdx - 1, nextIdx + 1]
        .filter((i) => i >= 0 && i < PLATFORMS.length)
        .forEach((i) => loadPlatform(PLATFORMS[i].key));
    }, 180);
  };

  if (token === null) return null;

  const meta                              = PLATFORMS.find((p) => p.key === activeTab);
  const { profiles, selectedId, history, loading } = cache[activeTab];

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
            Plataformas
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Estadísticas detalladas de cada red social
          </p>
        </div>

        {/* ── Tabs de plataforma ───────────────────────────────────────── */}
        <div className="flex gap-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5">
          {PLATFORMS.map((p) => {
            const isActive  = p.key === activeTab;
            const platCache = cache[p.key];
            const hasData   = platCache.profiles !== undefined && !platCache.loading;
            const hasProfiles = hasData && platCache.profiles.length > 0;
            return (
              <button
                key={p.key}
                onClick={() => handleTabChange(p.key)}
                disabled={animating}
                className={[
                  "relative flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "text-white shadow-md"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]/60",
                ].join(" ")}
                style={isActive ? { background: p.color } : {}}
              >
                <PlatformIcon platform={p.key} size={16} color={isActive ? "white" : p.color} />
                <span className="hidden sm:inline">{p.label}</span>

                {/* Punto indicador: verde = tiene perfiles, gris = sin perfiles */}
                {hasData && (
                  <span
                    className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                    style={{ background: hasProfiles
                      ? (isActive ? "rgba(255,255,255,0.7)" : "var(--color-success)")
                      : (isActive ? "rgba(255,255,255,0.4)" : "var(--color-muted)") }}
                  />
                )}

                {/* Badge con el número de perfiles si hay más de 1 */}
                {hasProfiles && platCache.profiles.length > 1 && (
                  <span
                    className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: p.color, color: "white", outline: "2px solid var(--color-surface)" }}
                  >
                    {platCache.profiles.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Selector de perfil (fuera de PlatformPage para esta vista) ── */}
        {profiles && profiles.length > 1 && (
          <ProfileSelector
            profiles={profiles}
            selectedId={selectedId}
            color={meta.color}
            onSelect={(id) => handleSelectProfile(activeTab, id)}
          />
        )}

        {/* ── Contenido con transición ─────────────────────────────────── */}
        <div style={{
          opacity:    animating ? 0 : 1,
          transform:  animating ? `translateX(${direction * 24}px)` : "translateX(0)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}>
          <PlatformPage
            key={activeTab}
            platform={activeTab}
            profiles={profiles === undefined ? [] : (profiles || [])}
            selectedId={selectedId}
            onSelectProfile={(id) => handleSelectProfile(activeTab, id)}
            history={history}
            period={period}
            onPeriod={setPeriod}
            loading={loading}
            chartFields={meta.chartFields}
            growthField={meta.growthField}
            // Ocultamos el selector interno de PlatformPage porque lo
            // gestionamos aquí arriba con ProfileSelector
            hideProfileSelector
          />
        </div>

      </div>
    </AppShell>
  );
}

// ─── Selector de perfil: pills (≤5) o select (>5) ────────────────────────────
function ProfileSelector({ profiles, selectedId, color, onSelect }) {
  const usePills = profiles.length <= PILL_LIMIT;

  if (usePills) {
    return (
      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={[
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
                active
                  ? "text-white border-transparent shadow-sm"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]",
              ].join(" ")}
              style={active ? { background: color, borderColor: color } : {}}
            >
              @{p.username}
            </button>
          );
        })}
      </div>
    );
  }

  // Más de 5 → select
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] shrink-0">
        Perfil
      </label>
      <select
        value={selectedId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="h-10 flex-1 max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-3 text-sm text-[var(--color-text)] outline-none transition-all focus:ring-1"
        style={{ focusRingColor: color }}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>@{p.username}</option>
        ))}
      </select>
      <span className="text-xs text-[var(--color-muted)]">
        {profiles.length} perfiles
      </span>
    </div>
  );
}
