"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import { adminApi } from "@/lib/api";

// ─── localStorage helpers ─────────────────────────────────────────────────────
const sub      = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken = () => localStorage.getItem("token");
const getRole  = () => localStorage.getItem("userRole") || "user";
const snap     = () => null;

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const toInput  = (d) => d ? new Date(d).toISOString().split("T")[0] : ""; // YYYY-MM-DD para <input type="date">

// ─── Configuración de campos por plataforma ───────────────────────────────────
const PLATFORM_FIELDS = {
  youtube:   { int: ["views","likes","subscribers","paidMembers"], dec: ["donations"] },
  tiktok:    { int: ["views","likes","comments","favorites","shares","followers"], dec: [] },
  twitch:    { int: ["views","followers","subscribersTwitch","bits"], dec: [] },
  instagram: { int: ["views","likes","favorites","followers","posts"], dec: [] },
};
const FIELD_LABELS = {
  views:"Visitas", likes:"Likes", subscribers:"Suscriptores", paidMembers:"Miembros pago",
  donations:"Donaciones (€)", comments:"Comentarios", favorites:"Guardados", shares:"Compartidos",
  followers:"Seguidores", subscribersTwitch:"Suscriptores", bits:"Bits", posts:"Publicaciones",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [{ id:"users", label:"Usuarios" }, { id:"profiles", label:"Perfiles" }, { id:"metrics", label:"Métricas" }];

// ─── Botón borrar con doble confirmación ──────────────────────────────────────
function DeleteBtn({ onConfirm, label = "Eliminar", small = false }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <span className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-muted)]">¿Seguro?</span>
      <button onClick={() => { setConfirm(false); onConfirm(); }} className="rounded px-2 py-1 text-xs font-bold bg-[var(--color-error)] text-white hover:opacity-80">Sí</button>
      <button onClick={() => setConfirm(false)} className="rounded px-2 py-1 text-xs font-semibold border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]">No</button>
    </span>
  );
  return (
    <button onClick={() => setConfirm(true)} className={["rounded border border-[var(--color-error)]/40 text-[var(--color-error)] font-semibold transition-all hover:bg-[var(--color-error-soft)]", small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"].join(" ")}>
      {label}
    </button>
  );
}

// ─── Modal de edición de métrica ──────────────────────────────────────────────
function EditModal({ metric, platform, onSave, onClose }) {
  const cfg = PLATFORM_FIELDS[platform] || { int: [], dec: [] };
  const allFields = [...cfg.int, ...cfg.dec];

  // Inicializar form con los valores actuales
  const [form, setForm] = useState(() => {
    const f = { weekDate: toInput(metric.weekDate) };
    for (const field of allFields) f[field] = metric[field] !== undefined && metric[field] !== null ? String(metric[field]) : "0";
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.weekDate) { setError("La fecha es obligatoria"); return; }
    setSaving(true); setError("");
    try {
      const body = { weekDate: form.weekDate };
      for (const f of cfg.int) body[f] = parseInt(form[f] || "0", 10);
      for (const f of cfg.dec) body[f] = parseFloat(parseFloat(form[f] || "0").toFixed(2));
      await onSave(metric.id, body);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Editar métrica</h3>
            <p className="text-xs text-[var(--color-muted)]">{platform} · {fmtDate(metric.weekDate)}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-strong)] hover:text-[var(--color-text)]">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] border border-[var(--color-error)]/30 px-3 py-2 text-xs text-[var(--color-error)]">{error}</p>
          )}

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Fecha de la semana</label>
            <input
              type="date"
              value={form.weekDate}
              onChange={(e) => handleChange("weekDate", e.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Campos numéricos en grid */}
          <div className="grid grid-cols-2 gap-3">
            {allFields.map((field) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  {FIELD_LABELS[field] || field}
                </label>
                <input
                  type="number"
                  min="0"
                  step={cfg.dec.includes(field) ? "0.01" : "1"}
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[var(--color-muted)]">
            El engagement y el crecimiento se recalculan automáticamente al guardar.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <button onClick={onClose} className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AdminPage
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const token = useSyncExternalStore(sub, getToken, snap);
  const role  = useSyncExternalStore(sub, getRole,  snap);

  const [tab, setTab] = useState("users");

  const [users,           setUsers]           = useState([]);
  const [loadingUsers,    setLoadingUsers]     = useState(false);
  const [usersError,      setUsersError]       = useState("");

  const [profiles,        setProfiles]         = useState([]);
  const [loadingProfiles, setLoadingProfiles]  = useState(false);
  const [profilesError,   setProfilesError]    = useState("");

  const [selectedProfile, setSelectedProfile]  = useState(null);
  const [metrics,         setMetrics]          = useState([]);
  const [loadingMetrics,  setLoadingMetrics]   = useState(false);
  const [metricsError,    setMetricsError]     = useState("");

  // Modal de edición
  const [editingMetric,   setEditingMetric]    = useState(null); // metric row | null

  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  // Protección de ruta
  useEffect(() => {
    if (token === null) { router.replace("/login"); return; }
    if (role !== null && role !== "admin") router.replace("/dashboard");
  }, [token, role, router]);

  const fetchUsers = useCallback(async () => {
    try { setLoadingUsers(true); setUsersError(""); const d = await adminApi.getUsers(); setUsers(d.users || []); }
    catch (e) { setUsersError(e.message); } finally { setLoadingUsers(false); }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try { setLoadingProfiles(true); setProfilesError(""); const d = await adminApi.getAllProfiles(); setProfiles(d.profiles || []); }
    catch (e) { setProfilesError(e.message); } finally { setLoadingProfiles(false); }
  }, []);

  const fetchMetrics = useCallback(async (profileId) => {
    try { setLoadingMetrics(true); setMetricsError(""); const d = await adminApi.getMetrics(profileId); setMetrics(d.metrics || []); }
    catch (e) { setMetricsError(e.message); } finally { setLoadingMetrics(false); }
  }, []);

  useEffect(() => {
    if (tab === "users")    fetchUsers();
    if (tab === "profiles") fetchProfiles();
    if (tab === "metrics")  fetchProfiles();
  }, [tab, fetchUsers, fetchProfiles]);

  const handleDeleteUser = async (userId) => {
    try { const r = await adminApi.deleteUser(userId); showToast(r.message); fetchUsers(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      const r = await adminApi.deleteProfile(profileId); showToast(r.message);
      if (tab === "profiles") fetchProfiles();
      if (tab === "metrics") { fetchProfiles(); if (selectedProfile?.id === profileId) { setSelectedProfile(null); setMetrics([]); } }
    } catch (e) { showToast(`Error: ${e.message}`); }
  };

  const handleUpdateMetric = async (metricsId, body) => {
    const r = await adminApi.updateMetric(metricsId, body);
    showToast(r.message);
    setEditingMetric(null);
    fetchMetrics(selectedProfile.id);
  };

  const handleDeleteMetric = async (metricsId) => {
    try { const r = await adminApi.deleteMetric(metricsId); showToast(r.message); fetchMetrics(selectedProfile.id); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const handleDeleteAllMetrics = async (profileId) => {
    try { const r = await adminApi.deleteAllMetrics(profileId); showToast(r.message); fetchMetrics(profileId); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  if (token === null || role === null) return null;

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">

        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]"><ShieldIcon /></span>
          <div>
            <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">Panel de administración</h1>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">Gestiona usuarios, perfiles y métricas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={["flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-semibold transition-all duration-150", tab === t.id ? "bg-[var(--color-accent)] text-white shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"].join(" ")}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Usuarios ─────────────────────────────────────────── */}
        {tab === "users" && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Todos los usuarios</h2>
              {usersError && <p className="text-xs text-[var(--color-error)]">{usersError}</p>}
            </div>
            {loadingUsers ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 w-full"/>)}</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[var(--color-border)] text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    <th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Rol</th><th className="pb-3 pr-4">Perfiles</th>
                    <th className="pb-3 pr-4">Registrado</th><th className="pb-3 pr-4">Último acceso</th><th className="pb-3"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--color-surface-strong)]/30">
                        <td className="py-3 pr-4 font-medium text-[var(--color-text)]">{u.email}</td>
                        <td className="py-3 pr-4"><span className={["rounded-full px-2 py-0.5 text-xs font-bold", u.role==="admin" ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]" : "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"].join(" ")}>{u.role}</span></td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{u._count?.socialProfiles ?? 0}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{fmtDate(u.createdAt)}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{fmtDate(u.lastLogin)}</td>
                        <td className="py-3">{u.role !== "admin" && <DeleteBtn onConfirm={() => handleDeleteUser(u.id)} small />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-muted)]">No hay usuarios.</p>}
              </div>
            )}
          </Card>
        )}

        {/* ── TAB: Perfiles ─────────────────────────────────────────── */}
        {tab === "profiles" && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Todos los perfiles sociales</h2>
              {profilesError && <p className="text-xs text-[var(--color-error)]">{profilesError}</p>}
            </div>
            {loadingProfiles ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 w-full"/>)}</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[var(--color-border)] text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    <th className="pb-3 pr-4">Usuario</th><th className="pb-3 pr-4">Plataforma</th><th className="pb-3 pr-4">Propietario</th>
                    <th className="pb-3 pr-4">Métricas</th><th className="pb-3 pr-4">Creado</th><th className="pb-3"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--color-surface-strong)]/30">
                        <td className="py-3 pr-4 font-medium text-[var(--color-text)]">@{p.username}</td>
                        <td className="py-3 pr-4"><span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">{p.platform}</span></td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{p.user?.email || "—"}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{p._count?.metrics ?? 0}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted)]">{fmtDate(p.createdAt)}</td>
                        <td className="py-3"><DeleteBtn onConfirm={() => handleDeleteProfile(p.id)} small /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {profiles.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-muted)]">No hay perfiles.</p>}
              </div>
            )}
          </Card>
        )}

        {/* ── TAB: Métricas ─────────────────────────────────────────── */}
        {tab === "metrics" && (
          <div className="grid gap-4">
            <Card>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Selecciona un perfil</label>
                  {loadingProfiles ? <div className="skeleton h-11 w-full rounded-[var(--radius-md)]"/> : (
                    <select
                      className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                      value={selectedProfile?.id || ""}
                      onChange={(e) => { const p = profiles.find(x => x.id === e.target.value); setSelectedProfile(p||null); if(p) fetchMetrics(p.id); else setMetrics([]); }}
                    >
                      <option value="">— Elige un perfil —</option>
                      {profiles.map((p) => <option key={p.id} value={p.id}>@{p.username} ({p.platform}) — {p.user?.email}</option>)}
                    </select>
                  )}
                </div>
                {selectedProfile && metrics.length > 0 && (
                  <DeleteBtn label={`Borrar todas (${metrics.length})`} onConfirm={() => handleDeleteAllMetrics(selectedProfile.id)} />
                )}
              </div>
            </Card>

            {selectedProfile && (
              <Card>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Métricas de @{selectedProfile.username}
                    <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">({selectedProfile.platform})</span>
                  </h2>
                  {metricsError && <p className="text-xs text-[var(--color-error)]">{metricsError}</p>}
                </div>

                {loadingMetrics ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-10 w-full"/>)}</div>
                : metrics.length === 0 ? <p className="py-6 text-center text-sm text-[var(--color-muted)]">No hay métricas para este perfil.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                          <th className="pb-3 pr-4">Semana</th>
                          <th className="pb-3 pr-4">Engagement</th>
                          <th className="pb-3 pr-4">Crecimiento</th>
                          <th className="pb-3 pr-4">Creado</th>
                          <th className="pb-3 pr-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {metrics.map((m) => {
                          const g = m.growth !== null && m.growth !== undefined ? parseFloat(m.growth) : null;
                          return (
                            <tr key={m.id} className="hover:bg-[var(--color-surface-strong)]/30">
                              <td className="py-3 pr-4 font-medium text-[var(--color-text)]">{fmtDate(m.weekDate)}</td>
                              <td className="py-3 pr-4">
                                <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                                  {parseFloat(m.engagement ?? 0).toFixed(2)} %
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                {g === null
                                  ? <span className="text-xs text-[var(--color-muted)]">Primera semana</span>
                                  : <span className={`text-xs font-bold ${g >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>{g >= 0 ? "▲" : "▼"} {Math.abs(g).toFixed(2)} %</span>
                                }
                              </td>
                              <td className="py-3 pr-4 text-[var(--color-muted)]">{fmtDate(m.createdAt)}</td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Botón editar */}
                                  <button
                                    onClick={() => setEditingMetric(m)}
                                    className="rounded border border-[var(--color-accent)]/40 px-2 py-1 text-xs font-semibold text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent-soft)]"
                                  >
                                    Editar
                                  </button>
                                  <DeleteBtn onConfirm={() => handleDeleteMetric(m.id)} small />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

      </div>

      {/* Modal de edición */}
      {editingMetric && (
        <EditModal
          metric={editingMetric}
          platform={selectedProfile?.platform?.toLowerCase()}
          onSave={handleUpdateMetric}
          onClose={() => setEditingMetric(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)] shadow-lg">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

function ShieldIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
