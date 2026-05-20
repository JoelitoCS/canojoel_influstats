"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PlatformPage from "@/components/ui/PlatformPage";
import PlatformIcon from "@/components/ui/PlatformIcon";
import { profilesApi, metricsApi } from "@/lib/api";

// ─── Auth ────────────────────────────────────────────────────────────────────
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── Configuración de cada plataforma ────────────────────────────────────────
const PLATFORMS = [
  {
    key:         "instagram",
    label:       "Instagram",
    color:       "var(--color-instagram)",
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
    key:         "tiktok",
    label:       "TikTok",
    color:       "var(--color-tiktok)",
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
    key:         "youtube",
    label:       "YouTube",
    color:       "var(--color-youtube)",
    growthField: "subscribers",
    chartFields: [
      { key: "subscribers", label: "Suscriptores"    },
      { key: "views",       label: "Visitas"         },
      { key: "likes",       label: "Likes"           },
      { key: "paidMembers", label: "Miembros de pago"},
    ],
  },
  {
    key:         "twitch",
    label:       "Twitch",
    color:       "var(--color-twitch)",
    growthField: "followers",
    chartFields: [
      { key: "followers",         label: "Seguidores"    },
      { key: "views",             label: "Visualizaciones"},
      { key: "subscribersTwitch", label: "Suscriptores"  },
      { key: "bits",              label: "Bits donados"  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PlataformasPage — vista unificada con tabs de plataforma
// ─────────────────────────────────────────────────────────────────────────────
export default function PlataformasPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  // Leer tab inicial desde ?tab=youtube, fallback a instagram
  const initialTab = PLATFORMS.find((p) => p.key === searchParams.get("tab"))?.key ?? "instagram";
  const [activeTab,  setActiveTab]  = useState(initialTab);
  const [direction,  setDirection]  = useState(1);   // 1 = derecha→izquierda, -1 = izquierda→derecha
  const [animating,  setAnimating]  = useState(false);
  const [period,     setPeriod]     = useState("month");

  // Caché de datos por plataforma: { instagram: { profile, history, loading }, ... }
  const [cache, setCache] = useState(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, { profile: undefined, history: [], loading: true }]))
  );

  const prevTabRef = useRef(initialTab);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  // ── Cargar datos de una plataforma ───────────────────────────────────────
  const loadPlatform = useCallback(async (platformKey) => {
    // Si ya tiene datos (profile !== undefined), no recargar
    setCache((prev) => {
      if (prev[platformKey].profile !== undefined) return prev;
      return { ...prev, [platformKey]: { ...prev[platformKey], loading: true } };
    });

    try {
      const data    = await profilesApi.getAll();
      const list    = Array.isArray(data) ? data : data?.profiles || [];
      const profile = list.find((p) => p.platform?.toLowerCase() === platformKey) || null;

      let history = [];
      if (profile) {
        const m = await metricsApi.getAll(profile.id);
        history = m?.metrics || [];
      }

      setCache((prev) => ({
        ...prev,
        [platformKey]: { profile, history, loading: false },
      }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [platformKey]: { profile: null, history: [], loading: false },
      }));
    }
  }, []);

  // ── Cargar la plataforma activa al montar y al cambiar ───────────────────
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
      setPeriod("month"); // reset período al cambiar plataforma
      setAnimating(false);
      // Precargar plataformas adyacentes
      const adj = [nextIdx - 1, nextIdx + 1].filter((i) => i >= 0 && i < PLATFORMS.length);
      adj.forEach((i) => loadPlatform(PLATFORMS[i].key));
    }, 180);
  };

  if (token === null) return null;

  const meta       = PLATFORMS.find((p) => p.key === activeTab);
  const { profile, history, loading } = cache[activeTab];

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

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="relative">
          {/* Barra de tabs */}
          <div className="flex gap-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5">
            {PLATFORMS.map((p) => {
              const isActive = p.key === activeTab;
              return (
                <button
                  key={p.key}
                  onClick={() => handleTabChange(p.key)}
                  disabled={animating}
                  className={[
                    "relative flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold transition-all duration-250",
                    isActive
                      ? "text-white shadow-md"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]/60",
                  ].join(" ")}
                  style={isActive ? { background: p.color } : {}}
                >
                  <PlatformIcon
                    platform={p.key}
                    size={16}
                    color={isActive ? "white" : p.color}
                  />
                  {/* Label oculto en móvil muy pequeño */}
                  <span className="hidden sm:inline">{p.label}</span>

                  {/* Indicador de datos cargados */}
                  {cache[p.key].profile !== undefined && !cache[p.key].loading && (
                    <span
                      className={[
                        "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
                        cache[p.key].profile ? "bg-[var(--color-success)]" : "bg-[var(--color-muted)]",
                      ].join(" ")}
                      style={isActive ? { background: "rgba(255,255,255,0.6)" } : {}}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Contenido con animación de transición ────────────────────── */}
        <div
          style={{
            opacity:   animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction * 24}px)`
              : "translateX(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
        >
          <PlatformPage
            key={activeTab}          // fuerza remount limpio al cambiar plataforma
            platform={activeTab}
            profile={profile === undefined ? null : profile}
            history={history}
            period={period}
            onPeriod={setPeriod}
            loading={loading}
            chartFields={meta.chartFields}
            growthField={meta.growthField}
          />
        </div>
      </div>
    </AppShell>
  );
}
