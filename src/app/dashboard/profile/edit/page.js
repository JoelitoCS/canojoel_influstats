"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/app/dashboard/profile/edit/page.js — Editar perfil propio
//  Tabs: General · Foto de perfil · Redes sociales · Privacidad
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  updateSocialLinks,
  deleteSocialLink,
} from "@/lib/userProfileApi";

// ── Configuración de plataformas ──────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram",   placeholder: "https://instagram.com/tuusuario",   color: "#e1306c" },
  { id: "tiktok",    label: "TikTok",      placeholder: "https://tiktok.com/@tuusuario",      color: "#010101" },
  { id: "twitter",   label: "X / Twitter", placeholder: "https://x.com/tuusuario",            color: "#1da1f2" },
  { id: "youtube",   label: "YouTube",     placeholder: "https://youtube.com/@tucanal",        color: "#ff2222" },
  { id: "twitch",    label: "Twitch",      placeholder: "https://twitch.tv/tucanal",           color: "#7c3aed" },
  { id: "discord",   label: "Discord",     placeholder: "https://discord.gg/tuservidor",       color: "#5865f2" },
  { id: "github",    label: "GitHub",      placeholder: "https://github.com/tuusuario",        color: "#333"    },
  { id: "linkedin",  label: "LinkedIn",    placeholder: "https://linkedin.com/in/tuusuario",   color: "#0077b5" },
  { id: "website",   label: "Web personal",placeholder: "https://tuweb.com",                   color: "#635bff" },
];

// ── Sub-componentes ───────────────────────────────────────────────────────────
function FormField({ label, hint, counter, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
        {counter && (
          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>{counter}</span>
        )}
      </div>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength, onFocus, onBlur }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: 14,
        color: "var(--color-text)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--color-accent)"; e.target.style.boxShadow = "0 0 0 3px var(--color-accent-soft)"; onFocus?.(); }}
      onBlur={(e)  => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; onBlur?.(); }}
    />
  );
}

function TextArea({ value, onChange, placeholder, maxLength, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      style={{
        width: "100%", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)", padding: "10px 12px", fontSize: 14,
        color: "var(--color-text)", outline: "none", resize: "vertical",
        transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box", fontFamily: "inherit",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--color-accent)"; e.target.style.boxShadow = "0 0 0 3px var(--color-accent-soft)"; }}
      onBlur={(e)  => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, marginTop: 1,
          background: checked ? "var(--color-accent)" : "var(--color-border-strong)",
          position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
        }}>
        <div style={{
          position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: "50%", background: "white",
          transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>{label}</p>
        {description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-muted)" }}>{description}</p>}
      </div>
    </label>
  );
}

function SaveButton({ onClick, loading, disabled, label = "Guardar cambios" }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%", padding: "12px", borderRadius: "var(--radius-md)", border: "none",
        cursor: (loading || disabled) ? "not-allowed" : "pointer",
        background: "var(--color-accent)", color: "white", fontSize: 14, fontWeight: 700,
        opacity: (loading || disabled) ? 0.6 : 1, transition: "opacity 0.15s, transform 0.1s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
      onMouseEnter={(e) => { if (!loading && !disabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {loading ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: "spin 0.7s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
          </svg>
          Guardando…
        </>
      ) : label}
    </button>
  );
}

function Toast({ message, type = "success", onDismiss }) {
  if (!message) return null;
  const colors = {
    success: { bg: "var(--color-success-soft)", border: "var(--color-success)", text: "var(--color-success)" },
    error:   { bg: "var(--color-error-soft)",   border: "var(--color-error)",   text: "var(--color-error)"   },
  };
  const c = colors[type];
  return (
    <div style={{
      padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: 14, marginBottom: 20,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      animation: "scale-in 0.2s ease both",
    }}>
      <span>{message}</span>
      <button onClick={onDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: c.text, padding: 2, opacity: 0.7 }}>
        ✕
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Página principal
// ═══════════════════════════════════════════════════════════════════════════════
export default function EditProfilePage() {
  const router      = useRouter();
  const fileInputRef= useRef(null);

  const [form, setForm] = useState({
    username: "", displayName: "", bio: "", shortBio: "", country: "", isPublic: true,
  });
  const [avatarUrl,       setAvatarUrl]       = useState(null);
  const [avatarPreview,   setAvatarPreview]   = useState(null);
  const [avatarFile,      setAvatarFile]      = useState(null);
  const [socialLinks,     setSocialLinks]     = useState([]);
  const [newLink,         setNewLink]         = useState({ platform: "instagram", url: "", label: "", isPublic: true, isActive: true });

  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab,       setActiveTab]       = useState("general");
  const [toast,           setToast]           = useState(null); // { msg, type }

  // Cargar perfil al montar
  useEffect(() => {
    getMyProfile()
      .then((data) => {
        const p = data.profile;
        if (p) {
          setForm({
            username:    p.username    || "",
            displayName: p.displayName || "",
            bio:         p.bio         || "",
            shortBio:    p.shortBio    || "",
            country:     p.country     || "",
            isPublic:    p.isPublic    ?? true,
          });
          setAvatarUrl(p.avatarUrl || null);
          setSocialLinks(p.socialLinks || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Guardar perfil general ─────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateMyProfile(form);

      // Si hay avatar pendiente, subirlo
      if (avatarFile) {
        setUploadingAvatar(true);
        const res = await uploadAvatar(avatarFile);
        setAvatarUrl(res.avatarUrl);
        setAvatarFile(null);
        setAvatarPreview(null);
        setUploadingAvatar(false);
      }

      showToast("✅ Perfil guardado correctamente.");
    } catch (err) {
      showToast(err.message || "Error al guardar.", "error");
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  // ── Subir solo el avatar ───────────────────────────────────────────────────
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(avatarFile);
      setAvatarUrl(res.avatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      showToast("✅ Foto de perfil actualizada.");
    } catch (err) {
      showToast(err.message || "Error al subir la imagen.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Seleccionar avatar ─────────────────────────────────────────────────────
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo supera el límite de 5 MB.", "error");
      return;
    }
    const allowed = ["image/jpeg","image/png","image/webp","image/jpg"];
    if (!allowed.includes(file.type)) {
      showToast("Tipo de archivo no permitido. Usa JPG, PNG o WebP.", "error");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    // Limpiar el input para poder seleccionar el mismo archivo de nuevo
    e.target.value = "";
  };

  // ── Añadir red social ──────────────────────────────────────────────────────
  const addLink = async () => {
    if (!newLink.url.trim()) {
      showToast("Introduce la URL de la red social.", "error");
      return;
    }
    try {
      await updateSocialLinks([newLink]);
      const res = await getMyProfile();
      setSocialLinks(res.profile?.socialLinks || []);
      setNewLink({ platform: "instagram", url: "", label: "", isPublic: true, isActive: true });
      showToast("✅ Red social añadida.");
    } catch (err) {
      showToast(err.message || "Error al añadir.", "error");
    }
  };

  // ── Toggle visibilidad/activación de red social ────────────────────────────
  const toggleLink = async (link, field) => {
    try {
      await updateSocialLinks([{
        platform: link.platform, url: link.url, label: link.label,
        isPublic: field === "isPublic" ? !link.isPublic : link.isPublic,
        isActive: field === "isActive" ? !link.isActive : link.isActive,
      }]);
      const res = await getMyProfile();
      setSocialLinks(res.profile?.socialLinks || []);
    } catch (err) {
      showToast(err.message || "Error al actualizar.", "error");
    }
  };

  // ── Eliminar red social ────────────────────────────────────────────────────
  const removeLink = async (id) => {
    try {
      await deleteSocialLink(id);
      setSocialLinks((prev) => prev.filter((l) => l.id !== id));
      showToast("✅ Red social eliminada.");
    } catch (err) {
      showToast(err.message || "Error al eliminar.", "error");
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {[80, 400].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: "var(--radius-lg)", marginBottom: 16 }} />
        ))}
      </div>
    </AppShell>
  );

  const currentAvatar = avatarPreview || avatarUrl;
  const avatarLetter  = (form.username || form.displayName || "U").charAt(0).toUpperCase();

  const tabs = [
    { id: "general", label: "General",         emoji: "👤" },
    { id: "avatar",  label: "Foto de perfil",  emoji: "🖼️" },
    { id: "social",  label: "Redes sociales",  emoji: "🔗" },
    { id: "privacy", label: "Privacidad",       emoji: "🔒" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 800, color: "var(--color-text)" }}>
              Editar perfil
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-muted)" }}>
              Gestiona tu presencia en InfluStats
            </p>
          </div>
          {form.username && (
            <Link
              href={`/dashboard/profile/${form.username}`}
              style={{
                padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                background: "var(--color-surface)", color: "var(--color-text)", fontSize: 13, fontWeight: 500,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text)"; }}
            >
              👁 Ver mi perfil
            </Link>
          )}
        </div>

        {/* ── Toast ──────────────────────────────────────────────────── */}
        {toast && (
          <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
        )}

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 20,
          background: "var(--color-surface)", borderRadius: "var(--radius-md)",
          padding: 4, border: "1px solid var(--color-border)",
        }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "8px 8px", borderRadius: "var(--radius-sm)", border: "none",
                cursor: "pointer", fontSize: "clamp(11px, 2vw, 13px)", fontWeight: activeTab === tab.id ? 700 : 500,
                background: activeTab === tab.id ? "var(--color-accent)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--color-text-secondary)",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
              <span style={{ display: "inline-block", marginRight: 4 }}>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB: GENERAL
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === "general" && (
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "24px",
          }}>
            <FormField label="Username *"
              hint="Solo letras, números, puntos y guiones. 3-30 caracteres. Único en la plataforma."
              counter={`${form.username.length}/30`}>
              <TextInput value={form.username} onChange={(v) => setForm({ ...form, username: v })}
                placeholder="joelitocs" maxLength={30} />
            </FormField>

            <FormField label="Nombre visible" counter={`${(form.displayName || "").length}/60`}>
              <TextInput value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })}
                placeholder="Joel Cano" maxLength={60} />
            </FormField>

            <FormField label="Descripción corta"
              hint="Aparece en tarjetas de usuario y explorar (máx. 120 caracteres)."
              counter={`${(form.shortBio || "").length}/120`}>
              <TextArea value={form.shortBio} onChange={(v) => setForm({ ...form, shortBio: v })}
                placeholder="Creador de contenido 🎮" maxLength={120} rows={2} />
            </FormField>

            <FormField label="Biografía completa" counter={`${(form.bio || "").length}/500`}>
              <TextArea value={form.bio} onChange={(v) => setForm({ ...form, bio: v })}
                placeholder="Cuéntanos sobre ti, tus proyectos y pasiones…" maxLength={500} rows={4} />
            </FormField>

            <FormField label="País / Ubicación">
              <TextInput value={form.country} onChange={(v) => setForm({ ...form, country: v })}
                placeholder="España 🇪🇸" maxLength={50} />
            </FormField>

            <div style={{ marginTop: 4 }}>
              <SaveButton onClick={handleSaveProfile} loading={saving} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: AVATAR
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === "avatar" && (
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "24px",
          }}>
            {/* Preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                {currentAvatar ? (
                  <img src={currentAvatar} alt="avatar"
                    style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover",
                      border: "3px solid var(--color-accent)", boxShadow: "var(--shadow-card)" }} />
                ) : (
                  <div style={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: "var(--color-accent-soft)", border: "3px solid var(--color-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, fontWeight: 800, color: "var(--color-accent)",
                    boxShadow: "var(--shadow-card)",
                  }}>
                    {avatarLetter}
                  </div>
                )}
                {avatarPreview && (
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--color-success)", border: "2px solid var(--color-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                  }}>
                    ✓
                  </div>
                )}
              </div>

              <div>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                  Foto de perfil
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--color-muted)" }}>
                  Formatos: JPG, PNG, WebP · Máximo 5 MB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "9px 18px", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-accent)",
                    background: "var(--color-accent-soft)", color: "var(--color-accent)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                  📁 Elegir imagen
                </button>
                <input
                  ref={fileInputRef} type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  style={{ display: "none" }} onChange={handleAvatarSelect}
                />
              </div>
            </div>

            {/* Info del archivo seleccionado */}
            {avatarFile && (
              <div style={{
                padding: "12px 14px", borderRadius: "var(--radius-md)", marginBottom: 16,
                background: "var(--color-accent-soft)", border: "1px solid var(--color-accent)44",
                fontSize: 13, color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>📎</span>
                <span>
                  <strong>{avatarFile.name}</strong>
                  {" — "}{(avatarFile.size / 1024).toFixed(0)} KB
                </span>
                <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-accent)", fontSize: 16, opacity: 0.7, padding: 2 }}>
                  ✕
                </button>
              </div>
            )}

            <SaveButton
              onClick={handleUploadAvatar}
              loading={uploadingAvatar}
              disabled={!avatarFile}
              label="🚀 Subir foto de perfil"
            />

            {!avatarFile && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-muted)", textAlign: "center" }}>
                Selecciona una imagen para poder subirla
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: REDES SOCIALES
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === "social" && (
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "24px",
          }}>
            {/* Formulario para añadir */}
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
              ➕ Añadir red social
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Plataforma
                </label>
                <select value={newLink.platform} onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                  style={{
                    width: "100%", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 13,
                    color: "var(--color-text)", outline: "none", cursor: "pointer",
                  }}>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Etiqueta (opcional)
                </label>
                <input value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Mi Instagram"
                  style={{
                    width: "100%", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 13,
                    color: "var(--color-text)", outline: "none", boxSizing: "border-box",
                  }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                URL *
              </label>
              <input value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder={SOCIAL_PLATFORMS.find((p) => p.id === newLink.platform)?.placeholder}
                style={{
                  width: "100%", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", padding: "9px 12px", fontSize: 13,
                  color: "var(--color-text)", outline: "none", boxSizing: "border-box",
                }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Toggle
                checked={newLink.isPublic}
                onChange={(v) => setNewLink({ ...newLink, isPublic: v })}
                label={newLink.isPublic ? "🌐 Visible públicamente" : "🔒 Solo tú puedes verla"}
                description={newLink.isPublic ? "Aparecerá en tu perfil público" : "Nadie más podrá verla"}
              />
            </div>

            <button onClick={addLink}
              style={{
                padding: "10px 22px", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700,
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.filter = "none"}>
              + Añadir red social
            </button>

            {/* Lista de redes configuradas */}
            {socialLinks.length > 0 && (
              <div style={{ marginTop: 28, borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                  Mis redes sociales ({socialLinks.length})
                </h3>
                {socialLinks.map((link) => {
                  const plat = SOCIAL_PLATFORMS.find((p) => p.id === link.platform);
                  return (
                    <div key={link.id} style={{
                      borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                      background: "var(--color-surface-strong)", marginBottom: 8, overflow: "hidden",
                      opacity: link.isActive ? 1 : 0.55, transition: "opacity 0.2s",
                    }}>
                      {/* Barra de color */}
                      <div style={{ height: 3, background: plat?.color || "var(--color-accent)" }} />

                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                            {link.label || plat?.label || link.platform}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                            {link.url}
                          </p>
                        </div>

                        {/* Toggles */}
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                            <div onClick={() => toggleLink(link, "isPublic")}
                              style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: link.isPublic ? "var(--color-accent)" : "var(--color-border-strong)",
                                position: "relative", transition: "background 0.2s", cursor: "pointer",
                              }}>
                              <div style={{
                                position: "absolute", top: 2, left: link.isPublic ? 18 : 2,
                                width: 16, height: 16, borderRadius: "50%", background: "white",
                                transition: "left 0.2s",
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 500 }}>
                              {link.isPublic ? "Pública" : "Privada"}
                            </span>
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                            <div onClick={() => toggleLink(link, "isActive")}
                              style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: link.isActive ? "var(--color-success)" : "var(--color-border-strong)",
                                position: "relative", transition: "background 0.2s", cursor: "pointer",
                              }}>
                              <div style={{
                                position: "absolute", top: 2, left: link.isActive ? 18 : 2,
                                width: 16, height: 16, borderRadius: "50%", background: "white",
                                transition: "left 0.2s",
                              }} />
                            </div>
                            <span style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 500 }}>
                              {link.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </label>
                        </div>

                        {/* Botón eliminar */}
                        <button onClick={() => removeLink(link.id)}
                          style={{
                            background: "none", border: "1px solid var(--color-error)",
                            color: "var(--color-error)", borderRadius: "var(--radius-sm)",
                            padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-error-soft)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {socialLinks.length === 0 && (
              <div style={{ marginTop: 24, padding: "24px 0", textAlign: "center", color: "var(--color-muted)", fontSize: 14 }}>
                <p style={{ margin: 0 }}>Aún no tienes redes sociales configuradas.</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>Añade la primera usando el formulario de arriba.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: PRIVACIDAD
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === "privacy" && (
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: "24px",
          }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
              Visibilidad del perfil
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--color-muted)", lineHeight: 1.6 }}>
              Controla quién puede ver tu perfil. Si lo pones como <strong>privado</strong>,
              desaparecerás de búsquedas, rankings y la página Explorar. Solo tú podrás verlo.
            </p>

            {/* Card de privacidad */}
            <div style={{
              padding: "18px", borderRadius: "var(--radius-md)", marginBottom: 20,
              border: `2px solid ${form.isPublic ? "var(--color-success)" : "var(--color-warning)"}`,
              background: form.isPublic ? "var(--color-success-soft)" : "var(--color-warning-soft)",
            }}>
              <Toggle
                checked={form.isPublic}
                onChange={(v) => setForm({ ...form, isPublic: v })}
                label={form.isPublic ? "✅ Perfil público" : "🔒 Perfil privado"}
                description={form.isPublic
                  ? "Visible en búsquedas, explorar y rankings."
                  : "Oculto de búsquedas, explorar y rankings."}
              />
            </div>

            {/* Info pills */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
              {[
                { icon: "🔍", label: "Buscador",   public: "Apareces", private: "Oculto" },
                { icon: "🏆", label: "Rankings",   public: "Incluido", private: "Excluido" },
                { icon: "🌐", label: "Explorar",   public: "Visible",  private: "Oculto" },
                { icon: "📊", label: "Estadísticas", public: "Públicas", private: "Privadas" },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: "12px 14px", borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-strong)", border: "1px solid var(--color-border)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                      color: form.isPublic ? "var(--color-success)" : "var(--color-warning)" }}>
                      {form.isPublic ? item.public : item.private}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <SaveButton onClick={handleSaveProfile} loading={saving} label="Guardar configuración de privacidad" />
          </div>
        )}

      </div>
    </AppShell>
  );
}
