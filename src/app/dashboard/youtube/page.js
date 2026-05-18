"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PlatformPage from "@/components/ui/PlatformPage";
import { profilesApi, metricsApi } from "@/lib/api";

const CHART_FIELDS = [
  { key: "subscribers", label: "Suscriptores"      },
  { key: "views",       label: "Visitas"            },
  { key: "likes",       label: "Likes"              },
  { key: "paidMembers", label: "Miembros de pago"   },
];

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

export default function YoutubePage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [profile, setProfile] = useState(undefined);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("month");

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  const init = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profilesApi.getAll();
      const list = Array.isArray(data) ? data : data?.profiles || [];
      const yt   = list.find((p) => p.platform?.toLowerCase() === "youtube") || null;
      setProfile(yt);
      if (yt) {
        const m = await metricsApi.getAll(yt.id);
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
        platform="youtube"
        profile={profile === undefined ? null : profile}
        history={history}
        period={period}
        onPeriod={setPeriod}
        loading={loading}
        chartFields={CHART_FIELDS}
        growthField="subscribers"
      />
    </AppShell>
  );
}
