"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { rankingApi } from "@/lib/api";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const sub      = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken = () => localStorage.getItem("token");
const snap     = () => null;

// ─── Plataformas ──────────────────────────────────────────────────────────────
const PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "#e1306c" },
  { value: "tiktok",    label: "TikTok",    color: "#00f2ea" },
  { value: "youtube",   label: "YouTube",   color: "#ff0000" },
  { value: "twitch",    label: "Twitch",    color: "#9146ff" },
];

// ─── Etiquetas de campos ──────────────────────────────────────────────────────
const FIELD_LABELS = {
  views: "Visualizaciones", likes: "Likes", subscribers: "Suscriptores",
  paidMembers: "Miembros pago", donations: "Donaciones (€)",
  comments: "Comentarios", favorites: "Guardados", shares: "Compartidos",
  followers: "Seguidores", subscribersTwitch: "Suscriptores Twitch",
  bits: "Bits donados", posts: "Publicaciones",
  engagement: "Engagement (%)", growth: "Crecimiento (%)",
};

// ─── Formato ──────────────────────────────────────────────────────────────────
const fmtNum = (field, v) => {
  if (v === null || v === undefined) return "—";
  const n = parseFloat(v);
  if (isNaN(n)) return "—";
  if (field === "donations") return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;
  if (field === "engagement" || field === "growth") return `${n.toFixed(2)} %`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

// ─── Tarjeta de un campo comparado ────────────────────────────────────────────
function CompareRow({ field, pA, pB, diff }) {
  const label   = FIELD_LABELS[field] || field;
  const winner  = diff?.winner;
  const absVal  = diff?.absolute;
  const pctVal  = diff?.percent;
  const hasData = absVal !== null && absVal !== undefined;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 px-4 py-3 transition-all hover:bg-[var(--color-surface-strong)]/70">

      {/* Valor A */}
      <div className={`text-right ${winner === "A" ? "text-[var(--color-success)] font-bold" : "text-[var(--color-text)]"}`}>
        <p className="text-base tabular-nums">{fmtNum(field, pA)}</p>
        {winner === "A" && <span className="text-[10px] font-semibold text-[var(--color-success)]">GANA</span>}
      </div>

      {/* Centro: etiqueta + diferencia */}
      <div className="flex flex-col items-center gap-1 min-w-[110px] text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
        {hasData ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            winner === "tie"
              ? "bg-[var(--color-border)]/60 text-[var(--color-muted)]"
              : winner === "A"
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-error-soft)] text-[var(--color-error)]"
          }`}>
            {winner === "tie" ? "EMPATE" : pctVal !== null ? `${Math.abs(pctVal).toFixed(1)} %` : fmtNum(field, Math.abs(absVal))}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--color-muted)]">Sin datos</span>
        )}
      </div>

      {/* Valor B */}
      <div className={`text-left ${winner === "B" ? "text-[var(--color-success)] font-bold" : "text-[var(--color-text)]"}`}>
        <p className="text-base tabular-nums">{fmtNum(field, pB)}</p>
        {winner === "B" && <span className="text-[10px] font-semibold text-[var(--color-success)]">GANA</span>}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CompararPage
// ─────────────────────────────────────────────────────────────────────────────
export default function CompararPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(sub, getToken, snap);

  const [platform,       setPlatform]       = useState("instagram");
  const [rankingList,    setRankingList]     = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [rankingError,   setRankingError]   = useState("");

  const [profileA, setProfileA] = useState("");
  const [profileB, setProfileB] = useState("");

  const [result,        setResult]        = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [resultError,   setResultError]   = useState("");

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  // Cargar ranking de la plataforma seleccionada para los selectores
  const fetchRanking = useCallback(async (plat) => {
    try {
      setLoadingRanking(true);
      setRankingError("");
      setProfileA(""); setProfileB(""); setResult(null);
      const data = await rankingApi.get(plat);
      setRankingList(data.ranking || []);
    } catch (e) {
      setRankingError(e.message || "Error al cargar perfiles");
    } finally {
      setLoadingRanking(false);
    }
  }, []);

  useEffect(() => { if (token) fetchRanking(platform); }, [token, platform, fetchRanking]);

  // Comparar
  const handleCompare = useCallback(async () => {
    if (!profileA || !profileB) return;
    try {
      setLoadingResult(true);
      setResultError("");
      setResult(null);
      const data = await rankingApi.compareProfiles(profileA, profileB);
      setResult(data);
    } catch (e) {
      setResultError(e.message || "Error al comparar");
    } finally {
      setLoadingResult(false);
    }
  }, [profileA, profileB]);

  if (token === null) return null;

  const platMeta = PLATFORMS.find((p) => p.value === platform);

  // Filtrar selectores para que A y B no puedan ser el mismo
  const optionsA = rankingList;
  const optionsB = rankingList.filter((p) => p.profileId !== profileA);
  const optionsAFiltered = rankingList.filter((p) => p.profileId !== profileB);

  const pAData = result?.profileA;
  const pBData = result?.profileB;
  const score  = result?.score;

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
            Comparar perfiles
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Compara las métricas de dos perfiles públicos de la misma plataforma
          </p>
        </div>

        {/* ── Panel de controles ───────────────────────────────────────── */}
        <Card>
          {/* Selector de plataforma */}
          <div className="mb-5 flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={[
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
                  platform === p.value
                    ? "text-white border-transparent"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]",
                ].join(" ")}
                style={platform === p.value ? { background: p.color, borderColor: p.color } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Selectores A y B */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            {/* Perfil A */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Perfil A
              </label>
              {loadingRanking ? (
                <div className="skeleton h-11 w-full rounded-[var(--radius-md)]" />
              ) : (
                <select
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none transition-all focus:ring-1"
                  style={{ "--tw-ring-color": platMeta?.color }}
                  value={profileA}
                  onChange={(e) => { setProfileA(e.target.value); setResult(null); }}
                >
                  <option value="">— Elige un perfil —</option>
                  {optionsAFiltered.map((p) => (
                    <option key={p.profileId} value={p.profileId}>
                      @{p.username} {p.displayName !== p.username ? `(${p.displayName})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* VS */}
            <div className="flex items-end justify-center pb-0.5">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs font-bold text-[var(--color-muted)]">
                VS
              </span>
            </div>

            {/* Perfil B */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Perfil B
              </label>
              {loadingRanking ? (
                <div className="skeleton h-11 w-full rounded-[var(--radius-md)]" />
              ) : (
                <select
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none transition-all focus:ring-1"
                  value={profileB}
                  onChange={(e) => { setProfileB(e.target.value); setResult(null); }}
                >
                  <option value="">— Elige un perfil —</option>
                  {optionsB.map((p) => (
                    <option key={p.profileId} value={p.profileId}>
                      @{p.username} {p.displayName !== p.username ? `(${p.displayName})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {rankingError && (
            <p className="mt-3 text-xs text-[var(--color-error)]">{rankingError}</p>
          )}
          {rankingList.length === 0 && !loadingRanking && !rankingError && (
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              No hay perfiles con métricas en {platMeta?.label}. Añade estadísticas primero.
            </p>
          )}

          {/* Botón comparar */}
          <button
            onClick={handleCompare}
            disabled={!profileA || !profileB || profileA === profileB || loadingResult}
            className="mt-5 rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: platMeta?.color }}
          >
            {loadingResult ? "Comparando…" : "Comparar"}
          </button>
        </Card>

        {/* ── Error resultado ───────────────────────────────────────────── */}
        {resultError && (
          <p className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {resultError}
          </p>
        )}

        {/* ── Resultado ────────────────────────────────────────────────── */}
        {result && (
          <div className="grid gap-4">

            {/* Cabeceras de los dos perfiles + marcador */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
              {/* Perfil A */}
              <div className="rounded-[var(--radius-lg)] border-2 p-5 text-center"
                style={{ borderColor: score.A > score.B ? "var(--color-success)" : "var(--color-border)" }}>
                <p className="text-xl font-bold text-[var(--color-text)]">@{pAData.username}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{fmtDate(pAData.weekDate)}</p>
                <p className="mt-3 text-4xl font-black" style={{ color: platMeta?.color }}>
                  {score.A}
                </p>
                <p className="text-xs text-[var(--color-muted)]">campos ganados</p>
                {score.A > score.B && (
                  <span className="mt-2 inline-block rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">
                    🏆 GANADOR
                  </span>
                )}
              </div>

              {/* Centro: plataforma + empates */}
              <div className="flex flex-col items-center justify-center gap-2 min-w-[80px]">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">{result.platform}</span>
                {score.tie > 0 && (
                  <span className="rounded-full bg-[var(--color-border)]/60 px-2 py-1 text-[10px] text-[var(--color-muted)]">
                    {score.tie} empates
                  </span>
                )}
              </div>

              {/* Perfil B */}
              <div className="rounded-[var(--radius-lg)] border-2 p-5 text-center"
                style={{ borderColor: score.B > score.A ? "var(--color-success)" : "var(--color-border)" }}>
                <p className="text-xl font-bold text-[var(--color-text)]">@{pBData.username}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{fmtDate(pBData.weekDate)}</p>
                <p className="mt-3 text-4xl font-black" style={{ color: platMeta?.color }}>
                  {score.B}
                </p>
                <p className="text-xs text-[var(--color-muted)]">campos ganados</p>
                {score.B > score.A && (
                  <span className="mt-2 inline-block rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">
                    🏆 GANADOR
                  </span>
                )}
              </div>
            </div>

            {/* Filas comparativas campo a campo */}
            <Card>
              <div className="mb-4 grid grid-cols-[1fr_auto_1fr] gap-3 text-center">
                <p className="text-sm font-bold text-[var(--color-text)]">@{pAData.username}</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] min-w-[110px]">Campo</p>
                <p className="text-sm font-bold text-[var(--color-text)]">@{pBData.username}</p>
              </div>
              <div className="flex flex-col gap-2">
                {(result.fields || []).map((field) => (
                  <CompareRow
                    key={field}
                    field={field}
                    pA={pAData.metrics?.[field]}
                    pB={pBData.metrics?.[field]}
                    diff={result.diff?.[field]}
                  />
                ))}
              </div>
            </Card>

          </div>
        )}

        {/* Estado vacío inicial */}
        {!result && !loadingResult && !resultError && profileA && profileB && (
          <Card>
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              Pulsa <strong>Comparar</strong> para ver los resultados.
            </p>
          </Card>
        )}

      </div>
    </AppShell>
  );
}
