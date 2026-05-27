"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profilesApi, metricsApi } from "@/lib/api";
import ProfilesTable from "@/components/ui/ProfilesTable";

const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok"    },
  { value: "youtube",   label: "YouTube"   },
  { value: "twitch",    label: "Twitch"    },
];

const IconFollowers  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const IconEngagement = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const IconProfiles   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>);
const IconViews      = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);

const isValidUrl = (v) => { try { const u = new URL(v); return ["http:","https:"].includes(u.protocol) && Boolean(u.hostname); } catch { return false; } };

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken   = () => localStorage.getItem("token");
const serverSnap = () => null;

const emptyForm = { name: "", url: "", platform: "instagram" };

export default function DashboardPage() {
  const router = useRouter();
  const token  = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  const [profiles, setProfiles]               = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError]     = useState("");
  const [summary, setSummary]                 = useState(null);
  const [loadingSummary, setLoadingSummary]   = useState(true);
  const [form, setForm]                       = useState({ ...emptyForm });
  const [errors, setErrors]                   = useState({});
  const [success, setSuccess]                 = useState("");
  const [loading, setLoading]                 = useState(false);
  const [staleProfiles, setStaleProfiles]     = useState([]);
  const [editingProfile, setEditingProfile]   = useState(null);
  const [editForm, setEditForm]               = useState({ ...emptyForm });
  const [editErrors, setEditErrors]           = useState({});
  const [editLoading, setEditLoading]         = useState(false);
  const [deletingId, setDeletingId]           = useState(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);

  useEffect(() => { if (token === null) router.replace("/login"); }, [router, token]);

  const fetchSummary = useCallback(async () => {
    try { setLoadingSummary(true); const d = await metricsApi.getSummary(); setSummary(d?.summary ?? null); }
    catch { setSummary(null); } finally { setLoadingSummary(false); }
  }, []);

  const fetchStaleness = useCallback(async () => {
    try { const d = await metricsApi.getStaleness(); setStaleProfiles(d?.stale ?? []); }
    catch { setStaleProfiles([]); }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true); setProfilesError("");
      const d = await profilesApi.getAll();
      setProfiles(Array.isArray(d) ? d : d?.profiles || []);
    } catch (err) { setProfilesError(err.message || "Error al cargar perfiles"); }
    finally { setLoadingProfiles(false); }
  }, []);

  useEffect(() => { if (token) { fetchProfiles(); fetchSummary(); fetchStaleness(); } }, [token, fetchProfiles, fetchSummary, fetchStaleness]);

  const metricCards = [
    { label: "Total Seguidores", value: summary?.totalFollowers ?? 0, suffix: "", icon: <IconFollowers />, variant: "accent",
      formatter: (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : n.toLocaleString("es-ES") },
    { label: "Engagement medio", value: summary?.avgEngagement ?? 0, suffix: "%", icon: <IconEngagement />, variant: "success", decimals: 2 },
    { label: "Perfiles",         value: profiles.length,             suffix: "", icon: <IconProfiles />,   variant: "secondary" },
    { label: "Visitas totales",  value: summary?.totalViews ?? 0,    suffix: "", icon: <IconViews />,      variant: "warning",
      formatter: (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : n.toLocaleString("es-ES") },
  ];

  const handleChange = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
    setErrors((c) => ({ ...c, [field]: undefined, general: undefined }));
    setSuccess("");
  };

  const validate = (data) => {
    const e = {};
    if (data.name.trim().length < 2) e.name = "Introduce un nombre válido";
    if (!isValidUrl(data.url)) e.url = "Introduce una URL http:// o https:// válida";
    if (!platforms.some((p) => p.value === data.platform)) e.platform = "Selecciona una plataforma válida";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate(form); setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const d = await profilesApi.create(form);
      setSuccess(d.message || "Perfil social creado correctamente");
      setForm({ ...emptyForm }); fetchProfiles(); fetchSummary();
    } catch (err) { setErrors({ general: err.message }); }
    finally { setLoading(false); }
  };

  const openEdit = (p) => { setEditingProfile(p); setEditForm({ name: p.username||p.name||"", url: p.url||"", platform: p.platform||"instagram" }); setEditErrors({}); };
  const handleEditChange = (field, value) => { setEditForm((c) => ({ ...c, [field]: value })); setEditErrors((c) => ({ ...c, [field]: undefined, general: undefined })); };

  const handleEditSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate(editForm); setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    try { setEditLoading(true); await profilesApi.update(editingProfile.id, editForm); setEditingProfile(null); fetchProfiles(); }
    catch (err) { setEditErrors({ general: err.message }); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try { setDeleteLoading(true); await profilesApi.delete(deletingId); setDeletingId(null); fetchProfiles(); fetchSummary(); }
    catch (err) { setProfilesError(err.message); setDeletingId(null); }
    finally { setDeleteLoading(false); }
  };

  if (token === null) return null;

  return (
    <AppShell>
      <div className="grid gap-5 animate-fade-in sm:gap-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl lg:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Métricas en tiempo real de tus perfiles sociales</p>
        </div>

        {/* ── Stat cards: 1 col móvil → 2 col sm → 4 col lg ── */}
        <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {metricCards.map((card) => (
            <MetricCard key={card.label} {...card} loading={loadingSummary || loadingProfiles} decimals={card.decimals ?? 0} />
          ))}
        </div>

        {/* ── Banner stale ── */}
        {staleProfiles.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-5 sm:py-4">
            {/* En móvil apilamos verticalmente; en sm+ va en fila */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-amber-500/20 text-amber-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-300">
                    {staleProfiles.length === 1 ? "1 perfil lleva más de 7 días sin actualizarse" : `${staleProfiles.length} perfiles llevan más de 7 días sin actualizarse`}
                  </p>
                  {/* En móvil mostramos solo los 2 primeros para no saturar */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {staleProfiles.slice(0, 3).map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        @{p.username}
                        <span className="text-amber-500/70">·</span>
                        <span className="text-amber-400/70">{p.platform}</span>
                        {p.daysAgo !== null && <span className="text-amber-500/60">· {p.daysAgo}d</span>}
                      </span>
                    ))}
                    {staleProfiles.length > 3 && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                        +{staleProfiles.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a
                href="/dashboard/metrics"
                className="shrink-0 self-start rounded-[var(--radius-md)] bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-amber-400 active:scale-95 sm:self-auto"
              >
                Actualizar ahora
              </a>
            </div>
          </div>
        )}

        {/* ── Distribución por plataforma ── */}
        {!loadingSummary && summary && summary.totalFollowers > 0 && (
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">Distribución por plataforma</h2>
              <p className="mt-0.5 text-xs text-[var(--color-muted)] sm:text-sm">Seguidores / suscriptores de la última semana registrada</p>
            </div>
            <div className="space-y-4">
              {[
                { key: "instagram", label: "Instagram", color: "var(--color-instagram)" },
                { key: "tiktok",    label: "TikTok",    color: "var(--color-tiktok)"    },
                { key: "youtube",   label: "YouTube",   color: "var(--color-youtube)"   },
                { key: "twitch",    label: "Twitch",    color: "var(--color-twitch)"    },
              ].filter((p) => (summary.platformBreakdown?.[p.key] ?? 0) > 0).map((p) => {
                const count = summary.platformBreakdown[p.key] ?? 0;
                const pct   = summary.totalFollowers > 0 ? Math.round((count / summary.totalFollowers) * 100) : 0;
                return (
                  <div key={p.key}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                        <span className="font-medium text-[var(--color-text)] text-xs sm:text-sm">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[var(--color-muted)] text-xs sm:text-sm">{count.toLocaleString("es-ES")}</span>
                        <span className="w-7 text-right font-semibold text-[var(--color-text)] text-xs sm:text-sm sm:w-8">{pct}%</span>
                      </div>
                    </div>
                    <div className="engagement-bar">
                      <div className="engagement-bar__fill" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Mis perfiles ── */}
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">Mis perfiles</h2>
              <p className="mt-0.5 text-xs text-[var(--color-muted)] sm:text-sm">Tus redes sociales registradas</p>
            </div>
            {profiles.length > 0 && (
              <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                {profiles.length} {profiles.length === 1 ? "perfil" : "perfiles"}
              </span>
            )}
          </div>

          {profilesError && (
            <p className="mb-4 animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
              {profilesError}
            </p>
          )}

          {loadingProfiles ? (
            <div className="space-y-3 py-6">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
          ) : (
            <ProfilesTable profiles={profiles} onEdit={openEdit} onDelete={setDeletingId} />
          )}
        </Card>

        {/* ── Formulario añadir perfil ── */}
        <Card>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[var(--color-text)] sm:text-lg">Añadir perfil social</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)] sm:text-sm">Añade una red social con nombre, URL real y plataforma.</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {errors.general && <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">{errors.general}</p>}
            {success && <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">{success}</p>}

            {/* En móvil va apilado; en md va en 2 columnas */}
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nombre" value={form.name} onChange={(e) => handleChange("name", e.target.value)} error={errors.name} placeholder="@canojoel" />

              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Plataforma</label>
                <select
                  className={["h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none", "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]", errors.platform ? "border-[var(--color-error)]" : "border-[var(--color-border)]"].join(" ")}
                  value={form.platform} onChange={(e) => handleChange("platform", e.target.value)}
                >
                  {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {errors.platform && <p className="animate-fade-in text-xs text-[var(--color-error)]" role="alert">{errors.platform}</p>}
              </div>
            </div>

            <Input label="URL real" type="url" value={form.url} onChange={(e) => handleChange("url", e.target.value)} error={errors.url} placeholder="https://instagram.com/canojoel" />

            {/* Botón ocupa todo el ancho en móvil, ajustado en sm+ */}
            <Button type="submit" loading={loading} className="w-full sm:w-auto">Guardar perfil</Button>
          </form>
        </Card>
      </div>

      {/* ══ MODAL EDICIÓN ══ */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingProfile(null)} />
          {/* En móvil: sheet desde abajo (rounded solo arriba). En sm+: modal centrado. */}
          <div className="animate-scale-in relative w-full rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-[var(--shadow-card-hover)] sm:max-w-lg sm:rounded-[var(--radius-xl)] sm:p-6">
            {/* Drag handle visual solo en móvil */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)] sm:hidden" />

            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar perfil</h3>
              <button onClick={() => setEditingProfile(null)} className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleEditSubmit}>
              {editErrors.general && <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">{editErrors.general}</p>}
              <Input label="Nombre" value={editForm.name} onChange={(e) => handleEditChange("name", e.target.value)} error={editErrors.name} placeholder="@canojoel" />
              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Plataforma</label>
                <select
                  className={["h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none", "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]", editErrors.platform ? "border-[var(--color-error)]" : "border-[var(--color-border)]"].join(" ")}
                  value={editForm.platform} onChange={(e) => handleEditChange("platform", e.target.value)}
                >
                  {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <Input label="URL real" type="url" value={editForm.url} onChange={(e) => handleEditChange("url", e.target.value)} error={editErrors.url} placeholder="https://instagram.com/canojoel" />
              <div className="flex gap-3 pt-1">
                <Button type="submit" loading={editLoading} className="flex-1">Guardar cambios</Button>
                <Button type="button" variant="ghost" onClick={() => setEditingProfile(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL ELIMINAR ══ */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="animate-scale-in relative w-full rounded-t-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 shadow-[var(--shadow-card-hover)] sm:max-w-sm sm:rounded-[var(--radius-xl)] sm:p-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)] sm:hidden" />
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-error-soft)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </span>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Eliminar perfil</h3>
                <p className="text-sm text-[var(--color-muted)]">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleDelete} disabled={deleteLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {deleteLoading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
                Sí, eliminar
              </button>
              <Button type="button" variant="ghost" onClick={() => setDeletingId(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
