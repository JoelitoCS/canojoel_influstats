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

  const [profiles, setProfiles] = useState(undefined); // undefined=cargando, []=sin perfiles
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState("month");

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  const init = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      const igs  = list.filter((p) => p.platform?.toLowerCase() === "instagram");
      setProfiles(igs);
      if (igs.length > 0) setSelectedId(igs[0].id);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) init(); }, [token, init]);

  // Carga métricas cuando cambia el perfil seleccionado
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    metricsApi.getAll(selectedId)
      .then((m) => setHistory(m?.metrics || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (token === null) return null;

  return (
    <AppShell>
      <PlatformPage
        platform="instagram"
        profiles={profiles === undefined ? [] : profiles}
        selectedId={selectedId}
        onSelectProfile={setSelectedId}
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
