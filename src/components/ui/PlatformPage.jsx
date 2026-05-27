"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import PlatformIcon from "@/components/ui/PlatformIcon";

const PAGE_SIZE = 8;

export const PLATFORM_META = {
  instagram: { label: "Instagram", color: "#e1306c", gradient: "#e1306c,#f77737" },
  youtube:   { label: "YouTube",   color: "#ff0000", gradient: "#ff0000,#ff6b6b" },
  tiktok:    { label: "TikTok",    color: "#00f2ea", gradient: "#00f2ea,#ff0050" },
  twitch:    { label: "Twitch",    color: "#9146ff", gradient: "#9146ff,#bf94ff" },
};

function filterByPeriod(history, period) {
  if (!history?.length) return [];
  const now  = new Date();
  const from = new Date();
  if (period === "week")  from.setDate(now.getDate() - 7);
  if (period === "month") from.setMonth(now.getMonth() - 1);
  if (period === "year")  from.setFullYear(now.getFullYear() - 1);
  return history.filter((r) => new Date(r.weekDate) >= from);
}

const fmtXDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

const fmtShort = (n) => {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("es-ES");
};

const clampPct = (v) => Math.max(parseFloat(v) || 0, 0);

// ── Campos que siempre muestran el valor con sufijo % ─────────────────────────
// Se detecta por dataKey (nombre interno de Recharts) O por name (etiqueta visible).
// Esto cubre todos los tabs: en Métricas el dataKey es "engagement",
// en Crecimiento el name es "Crecimiento %".
const PCT_DATAKEYS = new Set(["engagement", "growth"]);
const PCT_NAMES    = new Set(["Engagement", "Crecimiento", "Crecimiento %"]);

// ── Tooltip personalizado ─────────────────────────────────────────────────────
// IMPORTANTE: p.value puede llegar como objeto Decimal de Prisma (no number JS)
// cuando los datos vienen directamente de la API sin deserializar.
// Por eso no usamos "typeof p.value === 'number'" sino clampPct() / Number()
// que hacen parseFloat internamente y funcionan con cualquier tipo.
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xl text-xs">
      <p className="mb-2 font-semibold text-[var(--color-muted)] uppercase tracking-widest">
        {fmtXDate(label)}
      </p>
      {payload.map((p) => {
        const isPct = PCT_DATAKEYS.has(p.dataKey) || PCT_NAMES.has(p.name);
        return (
          <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[var(--color-muted)]">{p.name}:</span>
            <span className="font-bold text-[var(--color-text)]">
              {isPct
                ? `${clampPct(p.value).toFixed(2)} %`
                : fmtShort(p.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AnimatedNumber({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    const start  = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(target * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return (
    <span>
      {display.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function GrowthBadge({ value }) {
  if (value === null || value === undefined)
    return <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">Primera semana</span>;
  const num = parseFloat(value);
  const pos = num >= 0;
  return (
    <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", pos ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-error-soft)] text-[var(--color-error)]"].join(" ")}>
      {pos ? "▲" : "▼"} {Math.abs(num).toFixed(2)} %
    </span>
  );
}

function SortTh({ label, colKey, sortKey, sortDir, onSort }) {
  const isActive = colKey === sortKey;
  return (
    <th className="pb-3 pr-4 last:pr-0" style={{ whiteSpace: "nowrap" }}>
      <button onClick={() => onSort(colKey)} className={["flex items-center gap-1 transition-colors duration-150 text-xs font-semibold uppercase tracking-widest", isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}>
        {label}
        <span className="flex flex-col leading-none" style={{ fontSize: 8 }}>
          <span style={{ opacity: isActive && sortDir === "asc"  ? 1 : 0.25 }}>▲</span>
          <span style={{ opacity: isActive && sortDir === "desc" ? 1 : 0.25 }}>▼</span>
        </span>
      </button>
    </th>
  );
}

function useInView(options = {}) {
  const ref     = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function ChartWrapper({ children, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity:    inView ? 1 : 0,
      transform:  inView ? "none" : "translateY(24px)",
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function ChartsSection({ data, chartFields, color, platform }) {
  const [activeTab, setActiveTab] = useState("metrics");
  const [animKey, setAnimKey]     = useState(0);

  const handleTab = (id) => { setActiveTab(id); setAnimKey((k) => k + 1); };

  const chartData = useMemo(
    () => [...data].reverse().map((r) => ({ ...r, _date: r.weekDate })),
    [data]
  );

  if (!chartData.length) return null;

  const gradId = `grad-${platform}`;

  return (
    <div className="chart-enter rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Evolución en el período</h2>
        <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 p-1">
          {[
            { id: "metrics",    label: "Métricas"    },
            { id: "engagement", label: "Engagement"  },
            { id: "growth",     label: "Crecimiento" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className={["rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all duration-150", activeTab === t.id ? "text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}
              style={activeTab === t.id ? { background: color } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "metrics" && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart key={animKey} data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {chartFields.map((f, i) => (
                <linearGradient key={f.key} id={`${gradId}-${f.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25 - i * 0.04} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="_date" tickFormatter={fmtXDate} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{value}</span>} />
            {chartFields.map((f, i) => (
              <Area key={f.key} type="monotone" dataKey={f.key} name={f.label} stroke={color}
                strokeWidth={i === 0 ? 2.5 : 1.5} strokeOpacity={1 - i * 0.15}
                fill={`url(#${gradId}-${f.key})`} dot={false}
                activeDot={{ r: 5, fill: color, stroke: "var(--color-surface)", strokeWidth: 2 }}
                animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {activeTab === "engagement" && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart key={animKey} data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${gradId}-eng`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-secondary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="_date" tickFormatter={fmtXDate} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="engagement" name="Engagement"
              stroke="var(--color-secondary)" strokeWidth={2.5} fill={`url(#${gradId}-eng)`}
              dot={{ r: 3, fill: "var(--color-secondary)", stroke: "var(--color-surface)", strokeWidth: 2 }}
              activeDot={{ r: 6 }} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {activeTab === "growth" && (() => {
        const growthData = chartData.filter((r) => r.growth !== null && r.growth !== undefined);
        if (!growthData.length)
          return <p className="py-10 text-center text-sm text-[var(--color-muted)]">Necesitas al menos 2 semanas para ver el crecimiento.</p>;
        return (
          <ResponsiveContainer key={animKey} width="100%" height={300}>
            <LineChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="_date" tickFormatter={fmtXDate} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="growth" name="Crecimiento %"
                stroke="var(--color-success)" strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const pos = payload.growth >= 0;
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={pos ? "var(--color-success)" : "var(--color-error)"} stroke="var(--color-surface)" strokeWidth={2} />;
                }}
                activeDot={{ r: 6 }} animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        );
      })()}
    </div>
  );
}

export default function PlatformPage({
  platform, profiles, selectedId, onSelectProfile,
  history, period, onPeriod, loading, chartFields, growthField,
  hideProfileSelector = false,
}) {
  const meta     = PLATFORM_META[platform];
  const profile  = profiles?.find((p) => p.id === selectedId) || profiles?.[0] || null;
  const filtered = filterByPeriod(history, period);
  const latest   = filtered[0] || null;
  const [visible, setVisible] = useState(false);

  const [sortKey, setSortKey] = useState("weekDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page,    setPage]    = useState(1);

  useEffect(() => { setPage(1); }, [period, sortKey, sortDir]);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : Number(av) - Number(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (!profiles?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-[var(--radius-xl)]"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
          <PlatformIcon platform={platform} size={40} color={meta.color} />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">Aún no tienes un perfil de {meta.label}</h2>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">Ve al Dashboard y añade tu perfil de {meta.label} para empezar a registrar estadísticas.</p>
        <a href="/dashboard" className="mt-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: meta.color }}>
          Ir al Dashboard
        </a>
      </div>
    );
  }

  const noData = !loading && filtered.length === 0;

  return (
    <div className="grid gap-6" style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)", transition: "opacity 0.4s ease, transform 0.4s ease" }}>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold flex items-center gap-3" style={{ color: meta.color }}>
            <PlatformIcon platform={platform} size={36} color={meta.color} />
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            @{profile.username} · Estadísticas y crecimiento semanal
          </p>
          {!hideProfileSelector && profiles.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profiles.map((p) => (
                <button key={p.id} onClick={() => onSelectProfile(p.id)}
                  className={["rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150", p.id === selectedId ? "text-white border-transparent" : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]"].join(" ")}
                  style={p.id === selectedId ? { background: meta.color, borderColor: meta.color } : {}}>
                  @{p.username}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {["week", "month", "year"].map((p) => (
            <button key={p} onClick={() => onPeriod(p)}
              className={["rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all duration-200", period === p ? "text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}
              style={period === p ? { background: meta.color } : {}}>
              {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-28 rounded-[var(--radius-lg)]"/>)}
        </div>
      ) : latest ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chartFields.map(({ key, label }, idx) => {
            const oldest  = filtered[filtered.length - 1];
            const curr    = latest[key]  != null ? Number(latest[key])  : null;
            const prev    = oldest && oldest.id !== latest.id && oldest[key] != null ? Number(oldest[key]) : null;
            const delta   = curr !== null && prev !== null ? curr - prev : null;
            const pct     = delta !== null && prev !== 0 ? (delta / Math.abs(prev)) * 100 : null;
            const positive = delta !== null && delta >= 0;
            return (
              <div key={key} className="stat-card rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: `opacity 0.4s ease ${idx*80}ms, transform 0.4s ease ${idx*80}ms`, borderTop: `3px solid ${meta.color}` }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-bold text-[var(--color-text)]"><AnimatedNumber value={curr ?? 0} /></p>
                {delta !== null ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${positive ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-error-soft)] text-[var(--color-error)]"}`}>
                      {positive
                        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8 L8 2 M3 2 h5 v5"/></svg>
                        : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2 L2 8 M7 8 H2 V3"/></svg>}
                      {pct !== null ? `${Math.abs(pct).toFixed(1)} %` : fmtShort(Math.abs(delta))}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">vs inicio del período</span>
                  </div>
                ) : (
                  key === growthField && <div className="mt-2"><GrowthBadge value={latest.growth} /></div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && !noData && (
        <ChartsSection data={filtered} chartFields={chartFields} color={meta.color} platform={platform} />
      )}

      {!loading && !noData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Historial de registros</h2>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              {sorted.length} {sorted.length === 1 ? "registro" : "registros"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[11px] uppercase tracking-widest text-[var(--color-muted)]">
                  <SortTh label="Semana"      colKey="weekDate"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  {chartFields.map(({ key, label }) => (
                    <SortTh key={key} label={label} colKey={key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  ))}
                  <SortTh label="Engagement"  colKey="engagement" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortTh label="Crecimiento" colKey="growth"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paginated.map((row, idx) => {
                  const g = row.growth != null ? parseFloat(row.growth) : null;
                  const rowBg = g === null ? undefined : g >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";
                  return (
                    <tr key={row.id} className="table-row-hover hover:bg-[var(--color-surface-strong)]/40"
                      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-8px)", transition: `opacity 0.3s ease ${idx*40}ms, transform 0.3s ease ${idx*40}ms`, background: rowBg }}>
                      <td className="py-3 pr-4 font-medium text-[var(--color-text)]">
                        {new Date(row.weekDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      {chartFields.map(({ key }) => (
                        <td key={key} className="py-3 pr-4 text-[var(--color-text)]">
                          {row[key] != null ? Number(row[key]).toLocaleString("es-ES") : "—"}
                        </td>
                      ))}
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-[var(--color-secondary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-secondary)]">
                          {clampPct(row.engagement ?? 0).toFixed(2)} %
                        </span>
                      </td>
                      <td className="py-3"><GrowthBadge value={row.growth} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-xs text-[var(--color-muted)]">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1}
                  className={["rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all", page===1 ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}>
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1)
                  .filter((n) => n===1 || n===totalPages || (n>=page-1 && n<=page+1))
                  .reduce((acc, n, i, arr) => { if (i>0 && n-arr[i-1]>1) acc.push("…"); acc.push(n); return acc; }, [])
                  .map((item, i) => item === "…"
                    ? <span key={`e${i}`} className="px-1 text-xs text-[var(--color-muted)]">…</span>
                    : <button key={item} onClick={() => setPage(item)}
                        className={["min-w-[28px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-semibold transition-all", page===item ? "border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}
                        style={page===item ? { background: meta.color } : {}}>
                        {item}
                      </button>
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className={["rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all", page===totalPages ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {noData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <p className="text-sm text-[var(--color-muted)]">No hay datos para el período seleccionado.</p>
          <a href="/dashboard/metrics" className="mt-3 inline-block text-sm font-semibold" style={{ color: meta.color }}>
            Añadir estadísticas →
          </a>
        </div>
      )}
    </div>
  );
}
