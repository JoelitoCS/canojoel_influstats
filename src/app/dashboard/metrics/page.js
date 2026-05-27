"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profilesApi, metricsApi } from "@/lib/api";

const PAGE_SIZE = 8;

function GrowthBadge({ value }) {
  if (value === null || value === undefined)
    return <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">1ª semana</span>;
  const num = parseFloat(value); const pos = num >= 0;
  return (
    <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", pos ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-error-soft)] text-[var(--color-error)]"].join(" ")}>
      {pos ? "▲" : "▼"} {Math.abs(num).toFixed(2)} %
    </span>
  );
}

function SortTh({ label, colKey, sortKey, sortDir, onSort }) {
  const active = colKey === sortKey;
  return (
    <th className="pb-3 pr-3 last:pr-0" style={{ whiteSpace: "nowrap" }}>
      <button
        onClick={() => onSort(colKey)}
        className={["flex items-center gap-1 text-xs font-semibold uppercase tracking-widest transition-colors", active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}
      >
        {label}
        <span className="flex flex-col leading-none" style={{ fontSize: 8 }}>
          <span style={{ opacity: active && sortDir === "asc"  ? 1 : 0.25 }}>▲</span>
          <span style={{ opacity: active && sortDir === "desc" ? 1 : 0.25 }}>▼</span>
        </span>
      </button>
    </th>
  );
}

const PLATFORM_FIELDS = {
  youtube: {
    label: "YouTube", engagementFormula: "(likes / visitas) × 100",
    fields: [
      { key: "views",       label: "Visitas",          placeholder: "125000" },
      { key: "likes",       label: "Likes",            placeholder: "8400" },
      { key: "subscribers", label: "Suscriptores",     placeholder: "52000" },
      { key: "paidMembers", label: "Miembros de pago", placeholder: "320", hint: "Miembros con membresía de pago del canal" },
      { key: "donations",   label: "Donaciones (€)",   placeholder: "150.00", hint: "Total de donaciones en euros", isDecimal: true },
    ],
  },
  tiktok: {
    label: "TikTok", engagementFormula: "((likes + comentarios + favoritos + compartidos) / visitas) × 100",
    fields: [
      { key: "views",     label: "Visitas",     placeholder: "980000" },
      { key: "likes",     label: "Likes",       placeholder: "74000" },
      { key: "comments",  label: "Comentarios", placeholder: "3200" },
      { key: "favorites", label: "Favoritos",   placeholder: "12500" },
      { key: "shares",    label: "Compartidos", placeholder: "6800" },
      { key: "followers", label: "Seguidores",  placeholder: "210000" },
    ],
  },
  twitch: {
    label: "Twitch", engagementFormula: "(suscriptores / seguidores) × 100",
    fields: [
      { key: "views",             label: "Visualizaciones",             placeholder: "45000" },
      { key: "followers",         label: "Seguidores",                  placeholder: "18000" },
      { key: "subscribersTwitch", label: "Suscriptores (Prime + pago)", placeholder: "940", hint: "Total de suscriptores Prime o de pago" },
      { key: "bits",              label: "Bits donados",                placeholder: "15000", hint: "Bits recibidos durante la semana" },
    ],
  },
  instagram: {
    label: "Instagram", engagementFormula: "((likes + guardados) / visitas) × 100",
    fields: [
      { key: "views",     label: "Visualizaciones", placeholder: "62000" },
      { key: "likes",     label: "Likes",           placeholder: "4100" },
      { key: "favorites", label: "Guardados",       placeholder: "890" },
      { key: "followers", label: "Seguidores",      placeholder: "28000" },
      { key: "posts",     label: "Publicaciones",   placeholder: "7" },
    ],
  },
};

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

const BASE_FORM = { profileId: "", weekDate: "" };
const buildEmptyForm = () => {
  const f = { ...BASE_FORM };
  Object.values(PLATFORM_FIELDS).forEach(({ fields }) => fields.forEach(({ key }) => { f[key] = ""; }));
  return f;
};

export default function MetricsPage() {
  const router = useRouter();
  const [form, setForm]       = useState(buildEmptyForm);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles]               = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError]     = useState("");

  const [history, setHistory]               = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [sortKey, setSortKey] = useState("weekDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage]       = useState(1);

  const token = useSyncExternalStore(subscribeStorage, getToken, serverSnap);
  useEffect(() => { setPage(1); }, [form.profileId, sortKey, sortDir, history]);
  useEffect(() => { if (token === null) router.replace("/login"); }, [router, token]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true); setProfilesError("");
      const d = await profilesApi.getAll();
      const list = Array.isArray(d) ? d : d?.profiles || [];
      setProfiles(list);
      if (list.length > 0) setForm((f) => ({ ...f, profileId: list[0].id }));
    } catch (err) { setProfilesError(err.message || "Error al cargar perfiles"); }
    finally { setLoadingProfiles(false); }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const fetchHistory = useCallback(async (profileId) => {
    if (!profileId) return;
    try { setLoadingHistory(true); const d = await metricsApi.getAll(profileId); setHistory(d?.metrics || []); }
    catch { setHistory([]); } finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { if (form.profileId) fetchHistory(form.profileId); }, [form.profileId, fetchHistory]);

  const activeProfile  = useMemo(() => profiles.find((p) => p.id === form.profileId) || null, [profiles, form.profileId]);
  const platformConfig = activeProfile ? PLATFORM_FIELDS[activeProfile.platform?.toLowerCase()] || null : null;

  const historyColumns = useMemo(() => {
    if (!platformConfig) return [];
    return [
      { key: "weekDate", label: "Semana", format: (v) => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) },
      ...platformConfig.fields.map(({ key, label, isDecimal }) => ({
        key, label,
        format: (v) => {
          if (v === null || v === undefined) return "—";
          if (isDecimal) return `${Number(v).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
          return Number(v).toLocaleString("es-ES");
        },
      })),
      { key: "engagement", label: "Eng.", format: (v) => v, isEngagement: true },
      { key: "growth",     label: "Crec.", format: (v) => v, isGrowth: true },
    ];
  }, [platformConfig]);

  const sortedHistory  = useMemo(() => {
    return [...history].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av == null) return 1; if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : Number(av) - Number(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [history, sortKey, sortDir]);

  const totalPages    = Math.max(1, Math.ceil(sortedHistory.length / PAGE_SIZE));
  const paginatedRows = sortedHistory.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleChange = (field, value) => { setForm((p) => ({ ...p, [field]: value })); setErrors((p) => ({ ...p, [field]: undefined, general: undefined })); setSuccess(""); };

  const validate = (data, config) => {
    const e = {};
    if (!data.profileId) e.profileId = "Selecciona un perfil";
    if (!data.weekDate) e.weekDate = "Introduce la fecha";
    else if (isNaN(new Date(data.weekDate).getTime())) e.weekDate = "Fecha no válida";
    if (config) {
      config.fields.forEach(({ key, label, isDecimal }) => {
        const n = Number(data[key]);
        if (data[key] === "" || isNaN(n) || n < 0) e[key] = `${label} debe ser >= 0`;
        else if (!isDecimal && !Number.isInteger(n)) e[key] = `${label} debe ser entero`;
      });
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate(form, platformConfig); setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const body = { weekDate: form.weekDate };
      platformConfig.fields.forEach(({ key, isDecimal }) => { body[key] = isDecimal ? parseFloat(Number(form[key]).toFixed(2)) : Number(form[key]); });
      const d = await metricsApi.create(form.profileId, body);
      setSuccess(d.message || "Métricas guardadas correctamente ✓");
      setForm((prev) => ({ ...buildEmptyForm(), profileId: prev.profileId }));
      fetchHistory(form.profileId);
    } catch (err) { setErrors({ general: err.message || "Error al guardar métricas" }); }
    finally { setLoading(false); }
  };

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (token === null) return null;

  return (
    <AppShell>
      <div className="grid gap-5 animate-fade-in sm:gap-6">

        {/* ── Cabecera ── */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl lg:text-4xl">Estadísticas semanales</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Los campos cambian según la plataforma. El engagement se calcula automáticamente.</p>
        </div>

        {/* ── Formulario de entrada ── */}
        <Card>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">Nueva entrada semanal</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)] sm:text-sm">Selecciona el perfil y rellena los datos de la semana.</p>
          </div>

          {profilesError && <p className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">{profilesError}</p>}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {errors.general && <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">{errors.general}</p>}
            {success && <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">{success}</p>}

            {/* Selector de perfil y fecha en grid responsivo */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Perfil social</label>
                {loadingProfiles ? <div className="skeleton h-11 w-full" /> : (
                  <select
                    className={["h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none", "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]", errors.profileId ? "border-[var(--color-error)]" : "border-[var(--color-border)]"].join(" ")}
                    value={form.profileId} onChange={(e) => handleChange("profileId", e.target.value)}
                  >
                    {profiles.length === 0 && <option value="">— Sin perfiles registrados —</option>}
                    {profiles.map((p) => <option key={p.id} value={p.id}>{p.username} ({p.platform})</option>)}
                  </select>
                )}
                {errors.profileId && <p className="animate-fade-in text-xs text-[var(--color-error)]" role="alert">{errors.profileId}</p>}
              </div>

              <Input label="Semana (fecha de inicio)" type="date" value={form.weekDate} onChange={(e) => handleChange("weekDate", e.target.value)} error={errors.weekDate} />
            </div>

            {/* Campos dinámicos por plataforma */}
            {platformConfig ? (
              <>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-accent-soft)]/30 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">{platformConfig.label} — métricas requeridas</p>
                  {/* Fórmula de engagement: truncada en móvil */}
                  <p className="mt-0.5 text-xs text-[var(--color-muted)] line-clamp-2 sm:line-clamp-none">Engagement: {platformConfig.engagementFormula}</p>
                </div>

                {/* 1 col en móvil → 2 en sm → 3 en lg */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {platformConfig.fields.map(({ key, label, placeholder, hint, isDecimal }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <Input label={label} type="number" min="0" step={isDecimal ? "0.01" : "1"} value={form[key]} onChange={(e) => handleChange(key, e.target.value)} error={errors[key]} placeholder={placeholder} />
                      {hint && !errors[key] && <p className="text-[11px] leading-tight text-[var(--color-muted)]">{hint}</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-[var(--color-muted)]">Selecciona un perfil para ver los campos disponibles.</p>
            )}

            <Button type="submit" loading={loading} disabled={profiles.length === 0 || !platformConfig} className="w-full sm:w-auto">
              Guardar estadísticas
            </Button>
          </form>
        </Card>

        {/* ── Historial de métricas ── */}
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">Historial de métricas</h2>
              <p className="mt-0.5 text-xs text-[var(--color-muted)] sm:text-sm">Pulsa una cabecera para ordenar · Color de fila indica crecimiento</p>
            </div>
            {sortedHistory.length > 0 && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                {sortedHistory.length} {sortedHistory.length === 1 ? "registro" : "registros"}
              </span>
            )}
          </div>

          {loadingHistory ? (
            <div className="space-y-3 py-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Aún no hay estadísticas para este perfil.<br />
              <span className="text-[var(--color-accent)]">¡Introduce tu primera entrada arriba!</span>
            </p>
          ) : (
            <>
              {/*
                overflow-x-auto: scroll horizontal en móvil cuando la tabla
                tiene más columnas de las que caben.
                -mx-2 + px-2: extiende el área de scroll hasta los bordes del card.
              */}
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[460px] px-2 sm:min-w-0 sm:px-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left">
                        {historyColumns.map((col) => (
                          <SortTh key={col.key} label={col.label} colKey={col.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {paginatedRows.map((row) => {
                        const g = row.growth !== null && row.growth !== undefined ? parseFloat(row.growth) : null;
                        const rowBg = g === null ? undefined : g >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";
                        return (
                          <tr key={row.id} className="transition-colors hover:bg-[var(--color-surface-strong)]/40" style={{ background: rowBg }}>
                            {historyColumns.map((col) => (
                              <td key={col.key} className="py-3 pr-3 last:pr-0">
                                {col.isEngagement ? (
                                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                                    {parseFloat(row[col.key] ?? 0).toFixed(2)} %
                                  </span>
                                ) : col.isGrowth ? (
                                  <GrowthBadge value={row[col.key]} />
                                ) : (
                                  <span className={col.key === "weekDate" ? "font-medium text-[var(--color-text)] whitespace-nowrap" : "text-[var(--color-text)] tabular-nums"}>
                                    {col.format(row[col.key])}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación — más compacta en móvil */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[var(--color-muted)]">Página {page} de {totalPages}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className={["rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all", page === 1 ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}
                    >← Ant.</button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || (n >= page - 1 && n <= page + 1))
                      .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push("…"); acc.push(n); return acc; }, [])
                      .map((item, i) =>
                        item === "…"
                          ? <span key={`e-${i}`} className="px-1 text-xs text-[var(--color-muted)]">…</span>
                          : <button key={item} onClick={() => setPage(item)}
                              className={["min-w-[28px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-semibold transition-all", page === item ? "border-[var(--color-accent)] text-white" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}
                              style={page === item ? { background: "var(--color-accent)" } : {}}>
                              {item}
                            </button>
                      )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className={["rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all", page === totalPages ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40" : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"].join(" ")}
                    >Sig. →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
