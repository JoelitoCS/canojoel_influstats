"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profilesApi } from "@/lib/api";
import ProfilesTable from "@/components/ui/ProfilesTable";

// Plataformas permitidas por el CHECK de la tabla social_profiles.
const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
];

// Métricas placeholder — se conectarán al backend en sprints futuros.
const defaultMetrics = [
  {
    label: "Total Seguidores",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Engagement",
    value: "0%",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "Perfiles",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    label: "Campañas",
    value: "0",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

// Valida URL en cliente.
const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) && Boolean(u.hostname);
  } catch {
    return false;
  }
};

const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken = () => localStorage.getItem("token");
const serverSnap = () => null;

// Formulario vacío por defecto.
const emptyForm = { name: "", url: "", platform: "instagram" };

// Dashboard principal con CRUD completo de perfiles sociales.
export default function DashboardPage() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeStorage, getToken, serverSnap);

  // ── Estado de perfiles ──
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState("");

  // ── Estado del formulario de crear ──
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Estado del modal de edición ──
  const [editingProfile, setEditingProfile] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // ── Estado de eliminación ──
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Redirige si no hay token.
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  // Carga los perfiles del usuario al montar.
  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      setProfilesError("");
      const data = await profilesApi.getAll();
      // La API puede devolver { profiles: [...] } o directamente un array.
      setProfiles(Array.isArray(data) ? data : data?.profiles || []);
    } catch (err) {
      setProfilesError(err.message || "Error al cargar perfiles");
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchProfiles();
  }, [token, fetchProfiles]);

  // ── Métricas derivadas del número real de perfiles ──
  const metrics = defaultMetrics.map((m) => {
    if (m.label === "Perfiles") return { ...m, value: String(profiles.length) };
    return m;
  });

  // ══════════════════════════════════════════════════
  //  CREAR PERFIL
  // ══════════════════════════════════════════════════
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const data = await profilesApi.create(form);
      setSuccess(data.message || "Perfil social creado correctamente");
      setForm({ ...emptyForm });
      fetchProfiles();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════
  //  EDITAR PERFIL
  // ══════════════════════════════════════════════════
  const openEdit = (profile) => {
    setEditingProfile(profile);
    setEditForm({
      name: profile.username || profile.name || "",
      url: profile.url || "",
      platform: profile.platform || "instagram",
    });
    setEditErrors({});
  };

  const handleEditChange = (field, value) => {
    setEditForm((c) => ({ ...c, [field]: value }));
    setEditErrors((c) => ({ ...c, [field]: undefined, general: undefined }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const e = validate(editForm);
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setEditLoading(true);
      await profilesApi.update(editingProfile.id, editForm);
      setEditingProfile(null);
      fetchProfiles();
    } catch (error) {
      setEditErrors({ general: error.message });
    } finally {
      setEditLoading(false);
    }
  };

  // ══════════════════════════════════════════════════
  //  ELIMINAR PERFIL
  // ══════════════════════════════════════════════════
  const confirmDelete = (id) => setDeletingId(id);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleteLoading(true);
      await profilesApi.delete(deletingId);
      setDeletingId(null);
      fetchProfiles();
    } catch (error) {
      setProfilesError(error.message);
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!token) return null;

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">
        {/* Header de página */}
        <div>
          <h1 className="font-[var(--font-display)] text-3xl text-[var(--color-text)] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Métricas en tiempo real de tus perfiles sociales
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="stat-card surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[var(--color-border-strong)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {m.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">{m.value}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  {m.icon}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Mis perfiles sociales ── */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Mis perfiles</h2>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                Tus redes sociales registradas
              </p>
            </div>
            {profiles.length > 0 && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
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
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : (
            <ProfilesTable
              profiles={profiles}
              onEdit={openEdit}
              onDelete={confirmDelete}
            />
          )}
        </Card>

        {/* ── Formulario de creación ── */}
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Añadir perfil social</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Añade una red social con nombre, URL real y plataforma.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {errors.general && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
                {errors.general}
              </p>
            )}

            {success && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2 text-sm text-[var(--color-success)]">
                {success}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                placeholder="@canojoel"
              />

              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
                  Plataforma
                </label>
                <select
                  className={[
                    "h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none",
                    "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
                    errors.platform ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
                  ].join(" ")}
                  value={form.platform}
                  onChange={(e) => handleChange("platform", e.target.value)}
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {errors.platform && (
                  <p className="animate-fade-in text-xs text-[var(--color-error)]" role="alert">
                    {errors.platform}
                  </p>
                )}
              </div>
            </div>

            <Input
              label="URL real"
              type="url"
              value={form.url}
              onChange={(e) => handleChange("url", e.target.value)}
              error={errors.url}
              placeholder="https://instagram.com/canojoel"
            />

            <Button type="submit" loading={loading} className="w-full sm:w-fit">
              Guardar perfil
            </Button>
          </form>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════
           MODAL DE EDICIÓN
         ══════════════════════════════════════════════════ */}
      {editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingProfile(null)}
          />
          <div className="animate-scale-in relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-6 shadow-[var(--shadow-card-hover)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Editar perfil</h3>
              <button
                onClick={() => setEditingProfile(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleEditSubmit}>
              {editErrors.general && (
                <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-3 py-2 text-sm text-[var(--color-error)]">
                  {editErrors.general}
                </p>
              )}

              <Input
                label="Nombre"
                value={editForm.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                error={editErrors.name}
                placeholder="@canojoel"
              />

              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
                  Plataforma
                </label>
                <select
                  className={[
                    "h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/60 px-4 text-sm text-[var(--color-text)] outline-none",
                    "transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]",
                    editErrors.platform ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
                  ].join(" ")}
                  value={editForm.platform}
                  onChange={(e) => handleEditChange("platform", e.target.value)}
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <Input
                label="URL real"
                type="url"
                value={editForm.url}
                onChange={(e) => handleEditChange("url", e.target.value)}
                error={editErrors.url}
                placeholder="https://instagram.com/canojoel"
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={editLoading} className="flex-1">
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingProfile(null)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
         ══════════════════════════════════════════════════ */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="animate-scale-in relative w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-6 shadow-[var(--shadow-card-hover)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-error-soft)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">Eliminar perfil</h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              >
                {deleteLoading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                Sí, eliminar
              </button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeletingId(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
