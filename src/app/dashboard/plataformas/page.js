"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef, use } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PlatformPage from "@/components/ui/PlatformPage";
import PlatformIcon from "@/components/ui/PlatformIcon";
import { profilesApi, metricsApi } from "@/lib/api";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken = () => localStorage.getItem("token");
const serverSnap = () => null;

// ─── TikTok theme helper ────────────────────────────────────────────────────
// Oscuro → botón blanco (contrasta con fondo oscuro), texto e icono negros
// Claro  → botón negro (contrasta con fondo claro), texto e icono blancos
function getTikTokStyle(theme) {
  const isDark = theme === "dark";
  return isDark
    ? { bg: "#ffffff", text: "#000000", icon: "#000000", border: "rgba(255,255,255,0.18)" }
    : { bg: "#000000", text: "#ffffff", icon: "#ffffff", border: "rgba(0,0,0,0.18)" };
}

// ─── Config de plataformas ────────────────────────────────────────────────────
const PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    color: "var(--color-instagram)",
    growthField: "followers",
    chartFields: [
      { key: "followers", label: "Seguidores" },
      { key: "views", label: "Visualizaciones" },
      { key: "likes", label: "Likes" },
      { key: "favorites", label: "Guardados" },
      { key: "posts", label: "Publicaciones" },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "var(--color-tiktok)",
    activeBg: "var(--color-tiktok-bg)",
    activeText: "var(--color-tiktok-text)",
    activeBorder: "var(--color-tiktok-border)",
    growthField: "followers",
    chartFields: [
      { key: "followers", label: "Seguidores" },
      { key: "views", label: "Visitas" },
      { key: "likes", label: "Likes" },
      { key: "comments", label: "Comentarios" },
      { key: "favorites", label: "Favoritos" },
      { key: "shares", label: "Compartidos" },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    color: "var(--color-youtube)",
    growthField: "subscribers",
    chartFields: [
      { key: "subscribers", label: "Suscriptores" },
      { key: "views", label: "Visitas" },
      { key: "likes", label: "Likes" },
      { key: "paidMembers", label: "Miembros de pago" },
    ],
  },
  {
    key: "twitch",
    label: "Twitch",
    color: "var(--color-twitch)",
    growthField: "followers",
    chartFields: [
      { key: "followers", label: "Seguidores" },
      { key: "views", label: "Visualizaciones" },
      { key: "subscribersTwitch", label: "Suscriptores" },
      { key: "bits", label: "Bits donados" },
    ],
  },
];

const PILL_LIMIT = 5;

// ─────────────────────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PlataformasPage({ searchParams: searchParamsPromise }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeStorage, getToken, serverSnap);
  const searchParams = use(searchParamsPromise);

  const initialTab =
    PLATFORMS.find((p) => p.key === searchParams?.tab)?.key ?? "instagram";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [period, setPeriod] = useState("month");
  const prevTabRef = useRef(initialTab);

  // Tema reactivo para TikTok
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme || "dark");
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  const [cache, setCache] = useState(() =>
    Object.fromEntries(
      PLATFORMS.map((p) => [
        p.key,
        { profiles: undefined, selectedId: null, history: [], loading: true },
      ])
    )
  );

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  const loadPlatform = useCallback(async (platformKey) => {
    setCache((prev) => {
      if (prev[platformKey].profiles !== undefined) return prev;
      return {
        ...prev,
        [platformKey]: { ...prev[platformKey], loading: true },
      };
    });

    try {
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      const profs = list.filter(
        (p) => p.platform?.toLowerCase() === platformKey
      );

      let history = [];
      const firstId = profs[0]?.id || null;

      if (firstId) {
        const m = await metricsApi.getAll(firstId);
        history = m?.metrics || [];
      }

      setCache((prev) => ({
        ...prev,
        [platformKey]: {
          profiles: profs,
          selectedId: firstId,
          history,
          loading: false,
        },
      }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [platformKey]: {
          profiles: [],
          selectedId: null,
          history: [],
          loading: false,
        },
      }));
    }
  }, []);

  const handleSelectProfile = useCallback(async (platformKey, profileId) => {
    setCache((prev) => ({
      ...prev,
      [platformKey]: {
        ...prev[platformKey],
        selectedId: profileId,
        loading: true,
      },
    }));

    try {
      const m = await metricsApi.getAll(profileId);

      setCache((prev) => ({
        ...prev,
        [platformKey]: {
          ...prev[platformKey],
          history: m?.metrics || [],
          loading: false,
        },
      }));
    } catch {
      setCache((prev) => ({
        ...prev,
        [platformKey]: {
          ...prev[platformKey],
          history: [],
          loading: false,
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (token) loadPlatform(activeTab);
  }, [token, activeTab, loadPlatform]);

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

      [nextIdx - 1, nextIdx + 1]
        .filter((i) => i >= 0 && i < PLATFORMS.length)
        .forEach((i) => loadPlatform(PLATFORMS[i].key));
    }, 180);
  };

  if (token === null) return null;

  const meta = PLATFORMS.find((p) => p.key === activeTab);
  const { profiles, selectedId, history, loading } = cache[activeTab];

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        <div>
          <h1 className="text-3xl font-bold">Plataformas</h1>
          <p className="text-sm opacity-70">
            Estadísticas detalladas de cada red social
          </p>
        </div>

        <div className="flex gap-2">
          {PLATFORMS.map((p) => {
            const isActive   = activeTab === p.key;
            const isTikTok    = p.key === "tiktok";
            const tiktokStyle = isTikTok ? getTikTokStyle(theme) : null;
            const activeBg    = isTikTok ? tiktokStyle.bg   : p.color;
            const activeText  = isTikTok ? tiktokStyle.text : "white";
            const activeIcon  = isTikTok ? tiktokStyle.icon : "white";
            const inactiveIcon = isTikTok
              ? (theme === "dark" ? "#ffffff" : "#000000")
              : p.color;
            const inactiveBorder = isTikTok
              ? tiktokStyle.border
              : p.color
                ? p.color.replace("var(--color-instagram)","rgba(225,48,108,0.35)").replace("var(--color-youtube)","rgba(255,34,34,0.35)").replace("var(--color-twitch)","rgba(124,58,237,0.35)")
                : "var(--color-border)";

            return (
              <button
                key={p.key}
                onClick={() => handleTabChange(p.key)}
                disabled={animating}
                className="btn-ripple flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-semibold transition-all duration-200 min-h-[44px]"
                style={
                  isActive
                    ? { background: activeBg, color: activeText, borderColor: activeBg, boxShadow: `0 2px 12px rgba(0,0,0,0.22), 0 0 0 1px ${activeBg}` }
                    : { background: "transparent", borderColor: inactiveBorder, color: "var(--color-muted)" }
                }
              >
                <PlatformIcon
                  platform={p.key}
                  size={16}
                  color={isActive ? activeIcon : inactiveIcon}
                />
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            );
          })}
        </div>

        <div>
          <PlatformPage
            platform={activeTab}
            profiles={profiles || []}
            selectedId={selectedId}
            onSelectProfile={(id) =>
              handleSelectProfile(activeTab, id)
            }
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