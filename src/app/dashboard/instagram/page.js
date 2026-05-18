"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PlatformPage from "@/components/ui/PlatformPage";
import { profilesApi, metricsApi } from "@/lib/api";

// Campos a mostrar en cards y gráficos para Instagram.
const CHART_FIELDS = [
  { key: "followers", label: "Seguidores"      },
  { key: "views",     label: "Visualizaciones" },
  { key: "likes",     label: "Likes"           },
  { key: "favorites", label: "Guardados"       },
  { key: "posts",     label: "Publicaciones"   },
];

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

export default function InstagramPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [profile, setProfile]   = useState(undefined); // undefined = cargando, null = no tiene
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState("month");

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  // Busca el perfil de Instagram del usuario y carga su historial.
  const init = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      // Filtramos por plataforma instagram.
      const ig   = list.find((p) => p.platform?.toLowerCase() === "instagram") || null;
      setProfile(ig);
      if (ig) {
        const m = await metricsApi.getAll(ig.id);
        setHistory(m?.metrics || []);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) init(); }, [token, init]);

  if (token === null) return null;

  return (
    <AppShell>
      <PlatformPage
        platform="instagram"
        profile={profile === undefined ? null : profile}
        history={history}
        period={period}
        onPeriod={setPeriod}
        loading={loading}
        chartFields={CHART_FIELDS}
        growthField="followers"
      />
    </AppShell>
  );
}
