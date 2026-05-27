"use client";

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { rankingApi } from "@/lib/api";

const sub      = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken = () => localStorage.getItem("token");
const snap     = () => null;

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram", color: "#e1306c" },
  { value: "tiktok",    label: "TikTok",    color: "var(--color-tiktok)", activeBg: "var(--color-tiktok-bg)", activeText: "var(--color-tiktok-text)", activeBorder: "var(--color-tiktok-border)" },
  { value: "youtube",   label: "YouTube",   color: "#ff0000" },
  { value: "twitch",    label: "Twitch",    color: "#9146ff" },
];

const COLOR_B = "#f59e0b";

const FIELD_LABELS = {
  views: "Visualizaciones", likes: "Likes", subscribers: "Suscriptores",
  paidMembers: "Miembros pago", donations: "Donaciones",
  comments: "Comentarios", favorites: "Guardados", shares: "Compartidos",
  followers: "Seguidores", subscribersTwitch: "Suscriptores", bits: "Bits",
  posts: "Publicaciones", engagement: "Engagement", growth: "Crecimiento",
};

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

const fmtShort = (v) => {
  const n = Number(v);
  if (isNaN(n)) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-[var(--color-muted)]">{p.name}:</span>
          <span className="font-bold text-[var(--color-text)]">{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Gráfica de barras con animación de rebote CSS ────────────────────────────
function DoubleBarChart({ result, colorA, nameA, nameB, animKey }) {
  const [ref, inView] = useInView();
  const exclude   = new Set(["growth", "donations"]);
  const chartData = (result.fields || [])
    .filter((f) => !exclude.has(f))
    .map((f) => ({
      name:    FIELD_LABELS[f] || f,
      [nameA]: result.profileA.metrics?.[f] != null ? Math.max(0, parseFloat(result.profileA.metrics[f])) : 0,
      [nameB]: result.profileB.metrics?.[f] != null ? Math.max(0, parseFloat(result.profileB.metrics[f])) : 0,
    }))
    .filter((d) => d[nameA] > 0 || d[nameB] > 0);

  if (!chartData.length) return null;

  // La animación CSS solo se inyecta cuando el gráfico entra en el viewport
  const uid = `bc-${animKey}`;
  const css = inView ? `
    #${uid} .recharts-bar-rectangle .recharts-rectangle {
      transform-box: fill-box;
      transform-origin: bottom;
      animation: barBounce-${uid} 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes barBounce-${uid} {
      from { transform: scaleY(0); opacity: 0; }
      to   { transform: scaleY(1); opacity: 1; }
    }
  ` : "";

  return (
    <div id={uid} ref={ref}>
      {css && <style>{css}</style>}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
          barCategoryGap="30%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
          <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
            formatter={(v) => <span style={{ color: "var(--color-muted)" }}>{v}</span>} />
          <Bar dataKey={nameA} name={nameA} fill={colorA} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey={nameB} name={nameB} fill={COLOR_B} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Gráfica de radar ─────────────────────────────────────────────────────────
function DoubleRadar({ result, colorA, nameA, nameB, animKey }) {
  const exclude = new Set(["growth"]);
  const fields  = (result.fields || []).filter((f) => !exclude.has(f));
  const radarData = fields.map((f) => {
    const vA = result.profileA.metrics?.[f] != null ? Math.max(0, parseFloat(result.profileA.metrics[f])) : 0;
    const vB = result.profileB.metrics?.[f] != null ? Math.max(0, parseFloat(result.profileB.metrics[f])) : 0;
    const max = Math.max(vA, vB, 1);
    return {
      field:   FIELD_LABELS[f] || f,
      [nameA]: parseFloat(((vA / max) * 100).toFixed(1)),
      [nameB]: parseFloat(((vB / max) * 100).toFixed(1)),
    };
  });
  if (!radarData.length) return null;
  return (
    <ResponsiveContainer key={animKey} width="100%" height={320}>
      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="field" tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]}
          tick={{ fill: "var(--color-muted)", fontSize: 9 }} tickFormatter={(v) => `${v}%`} />
        <Radar name={nameA} dataKey={nameA} stroke={colorA} fill={colorA} fillOpacity={0.25}
          animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        <Radar name={nameB} dataKey={nameB} stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.2}
          animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
        <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
          formatter={(v) => <span style={{ color: "var(--color-muted)" }}>{v}</span>} />
        <Tooltip formatter={(v, name) => [`${v} %`, name]}
          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Fila comparativa ─────────────────────────────────────────────────────────
function CompareRow({ field, pA, pB, diff }) {
  const label   = FIELD_LABELS[field] || field;
  const winner  = diff?.winner;
  const absVal  = diff?.absolute;
  const pctVal  = diff?.percent;
  const hasData = absVal !== null && absVal !== undefined;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 px-4 py-3 transition-all hover:bg-[var(--color-surface-strong)]/70">
      <div className={`text-right ${winner === "A" ? "text-[var(--color-success)] font-bold" : "text-[var(--color-text)]"}`}>
        <p className="text-base tabular-nums">{fmtNum(field, pA)}</p>
        {winner === "A" && <span className="text-[10px] font-semibold text-[var(--color-success)]">GANA</span>}
      </div>
      <div className="flex flex-col items-center gap-1 min-w-[110px] text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
        {hasData ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            winner === "tie" ? "bg-[var(--color-border)]/60 text-[var(--color-muted)]"
            : winner === "A" ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                             : "bg-[var(--color-error-soft)] text-[var(--color-error)]"
          }`}>
            {winner === "tie" ? "EMPATE" : pctVal !== null ? `${Math.abs(pctVal).toFixed(1)} %` : fmtNum(field, Math.abs(absVal))}
          </span>
        ) : <span className="text-[10px] text-[var(--color-muted)]">Sin datos</span>}
      </div>
      <div className={`text-left ${winner === "B" ? "text-[var(--color-success)] font-bold" : "text-[var(--color-text)]"}`}>
        <p className="text-base tabular-nums">{fmtNum(field, pB)}</p>
        {winner === "B" && <span className="text-[10px] font-semibold text-[var(--color-success)]">GANA</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CompararPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(sub, getToken, snap);

  const [platform,       setPlatform]      = useState("instagram");
  const [rankingList,    setRankingList]    = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [rankingError,   setRankingError]   = useState("");
  const [profileA,       setProfileA]       = useState("");
  const [profileB,       setProfileB]       = useState("");
  const [result,         setResult]         = useState(null);
  const [loadingResult,  setLoadingResult]  = useState(false);
  const [resultError,    setResultError]    = useState("");
  const [chartTab,       setChartTab]       = useState("bars");
  const [animKey,        setAnimKey]        = useState(0);
  const handleChartTab = (id) => { setChartTab(id); setAnimKey((k) => k + 1); };

  useEffect(() => { if (token === null) router.replace("/login"); }, [token, router]);

  const fetchRanking = useCallback(async (plat) => {
    try {
      setLoadingRanking(true); setRankingError("");
      setProfileA(""); setProfileB(""); setResult(null);
      const data = await rankingApi.get(plat);
      setRankingList(data.ranking || []);
    } catch (e) { setRankingError(e.message || "Error al cargar perfiles"); }
    finally     { setLoadingRanking(false); }
  }, []);

  useEffect(() => { if (token) fetchRanking(platform); }, [token, platform, fetchRanking]);

  const handleCompare = useCallback(async () => {
    if (!profileA || !profileB) return;
    try {
      setLoadingResult(true); setResultError(""); setResult(null);
      const data = await rankingApi.compareProfiles(profileA, profileB);
      setResult(data);
      setAnimKey((k) => k + 1);
    } catch (e) { setResultError(e.message || "Error al comparar"); }
    finally     { setLoadingResult(false); }
  }, [profileA, profileB]);

  if (token === null) return null;

  const platMeta = PLATFORMS.find((p) => p.value === platform);
  const colorA   = platMeta?.color || "#e1306c";
  const optionsB         = rankingList.filter((p) => p.profileId !== profileA);
  const optionsAFiltered = rankingList.filter((p) => p.profileId !== profileB);
  const pAData = result?.profileA;
  const pBData = result?.profileB;
  const score  = result?.score;
  const nameA  = pAData ? `@${pAData.username}` : "Perfil A";
  const nameB  = pBData ? `@${pBData.username}` : "Perfil B";

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">Comparar perfiles</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Compara las métricas de dos perfiles de la misma plataforma</p>
        </div>

        <Card>
          <div className="mb-5 flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => {
              const active = platform === p.value;
              return (
                <button key={p.value} onClick={() => setPlatform(p.value)}
                  className={["rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
                    active ? "shadow-sm" : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}
                  style={active ? { background: p.activeBg || p.color, color: p.activeText || "white", borderColor: p.activeBorder || "transparent" } : {}}>{p.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Perfil A</label>
              {loadingRanking ? <div className="skeleton h-11 w-full rounded-[var(--radius-md)]" /> : (
                <select className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none"
                  value={profileA} onChange={(e) => { setProfileA(e.target.value); setResult(null); }}>
                  <option value="">— Elige un perfil —</option>
                  {optionsAFiltered.map((p) => <option key={p.profileId} value={p.profileId}>@{p.username}</option>)}
                </select>
              )}
            </div>
            <div className="flex items-end justify-center pb-0.5">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs font-bold text-[var(--color-muted)]">VS</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Perfil B</label>
              {loadingRanking ? <div className="skeleton h-11 w-full rounded-[var(--radius-md)]" /> : (
                <select className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none"
                  value={profileB} onChange={(e) => { setProfileB(e.target.value); setResult(null); }}>
                  <option value="">— Elige un perfil —</option>
                  {optionsB.map((p) => <option key={p.profileId} value={p.profileId}>@{p.username}</option>)}
                </select>
              )}
            </div>
          </div>

          {rankingError && <p className="mt-3 text-xs text-[var(--color-error)]">{rankingError}</p>}
          {rankingList.length === 0 && !loadingRanking && !rankingError && (
            <p className="mt-3 text-xs text-[var(--color-muted)]">No hay perfiles con métricas en {platMeta?.label}.</p>
          )}

          <button onClick={handleCompare}
            disabled={!profileA || !profileB || profileA === profileB || loadingResult}
            className="mt-5 rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: colorA }}>
            {loadingResult ? "Comparando…" : "Comparar"}
          </button>
        </Card>

        {resultError && (
          <p className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">{resultError}</p>
        )}

        {result && (
          <div id="compare-result" className="grid gap-4">

            {/* Marcador */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
              {[{ data: pAData, sc: score.A, other: score.B, color: colorA },
                { data: pBData, sc: score.B, other: score.A, color: COLOR_B }].map((side, i) => (
                <div key={i} className="rounded-[var(--radius-lg)] border-2 p-5 text-center transition-all"
                  style={{ borderColor: side.sc > side.other ? "var(--color-success)" : "var(--color-border)" }}>
                  <div className="mx-auto mb-2 h-3 w-3 rounded-full" style={{ background: side.color }} />
                  <p className="text-xl font-bold text-[var(--color-text)]">@{side.data.username}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">{fmtDate(side.data.weekDate)}</p>
                  <p className="mt-3 text-4xl font-black" style={{ color: side.color }}>{side.sc}</p>
                  <p className="text-xs text-[var(--color-muted)]">campos ganados</p>
                  {side.sc > side.other && (
                    <span className="mt-2 inline-block rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">🏆 GANADOR</span>
                  )}
                </div>
              ))}
              <div className="col-start-2 col-end-3 row-start-1 flex flex-col items-center justify-center gap-2 min-w-[80px]">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">{result.platform}</span>
                {score.tie > 0 && (
                  <span className="rounded-full bg-[var(--color-border)]/60 px-2 py-1 text-[10px] text-[var(--color-muted)]">{score.tie} empates</span>
                )}
              </div>
            </div>

            {/* Gráficas */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-base font-semibold text-[var(--color-text)]">Comparativa visual</h2>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ background: colorA }} />
                      <span className="text-[var(--color-muted)]">{nameA}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ background: COLOR_B }} />
                      <span className="text-[var(--color-muted)]">{nameB}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 p-1">
                  {[{ id: "bars", label: "Barras" }, { id: "radar", label: "Radar" }].map((t) => (
                    <button key={t.id} onClick={() => handleChartTab(t.id)}
                      className={["rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                        chartTab === t.id ? "text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}
                      style={chartTab === t.id ? { background: colorA } : {}}>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartTab === "bars" && (
                <DoubleBarChart result={result} colorA={colorA} nameA={nameA} nameB={nameB} animKey={animKey} />
              )}
              {chartTab === "radar" && (
                <DoubleRadar result={result} colorA={colorA} nameA={nameA} nameB={nameB} animKey={animKey} />
              )}

              <p className="mt-3 text-center text-[11px] text-[var(--color-muted)]">
                {chartTab === "radar"
                  ? "Radar normalizado: cada campo se escala al 100% del valor máximo entre ambos perfiles"
                  : "Valores absolutos de cada métrica · Engagement y crecimiento excluidos por escala diferente"}
              </p>
            </div>

            {/* Filas campo a campo */}
            <Card>
              <div className="mb-4 grid grid-cols-[1fr_auto_1fr] gap-3 text-center">
                <div className="flex items-center justify-end gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: colorA }} />
                  <p className="text-sm font-bold text-[var(--color-text)]">{nameA}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] min-w-[110px]">Campo</p>
                <div className="flex items-center justify-start gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: COLOR_B }} />
                  <p className="text-sm font-bold text-[var(--color-text)]">{nameB}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(result.fields || []).map((field) => (
                  <CompareRow key={field} field={field}
                    pA={pAData.metrics?.[field]} pB={pBData.metrics?.[field]}
                    diff={result.diff?.[field]} />
                ))}
              </div>
            </Card>
          </div>
        )}

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
