'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { profilesApi } from '@/lib/api';

// Plataformas válidas (mismas que el backend para coherencia)
const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'youtube',   label: 'YouTube'   },
  { value: 'twitch',    label: 'Twitch'    },
];

// Validación de URL (misma lógica que en el dashboard de creación)
const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && Boolean(u.hostname);
  } catch {
    return false;
  }
};

// Modal de edición. Se muestra cuando el usuario pulsa "Editar" en la tabla.
// - profile: objeto con los datos actuales del perfil a editar
// - onClose: cierra el modal sin guardar
// - onSaved: callback que recibe el perfil actualizado para refrescar la tabla
export default function EditProfileModal({ profile, onClose, onSaved }) {
  // Pre-cargamos el formulario con los datos actuales del perfil
  const [form, setForm] = useState({
    name:     profile.username,
    url:      profile.url,
    platform: profile.platform,
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Si el perfil seleccionado cambia (edge case), sincronizamos el form
  useEffect(() => {
    setForm({ name: profile.username, url: profile.url, platform: profile.platform });
    setErrors({});
    setSuccess('');
  }, [profile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpiamos el error del campo que el usuario está corrigiendo
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Validación antes de enviar: mismas reglas que en el formulario de creación
  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2)      next.name     = 'Introduce un nombre válido';
    if (!isValidUrl(form.url))            next.url      = 'URL http:// o https:// inválida';
    if (!platforms.some((p) => p.value === form.platform)) {
      next.platform = 'Selecciona una plataforma válida';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      // Llamamos a PUT /api/profiles/:id con los datos del formulario
      const data = await profilesApi.update(profile.id, form);
      // Feedback visual de éxito antes de cerrar el modal
      setSuccess(data.message || 'Perfil actualizado correctamente');
      // Notificamos al dashboard para que refresque la tabla
      onSaved(data.profile);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay oscuro que cubre el fondo; pulsar fuera cierra el modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      {/* Contenedor del modal; stopPropagation evita cerrar al hacer clic dentro */}
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Editar perfil social</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Modifica los datos y guarda los cambios.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Error general de la API (p. ej. plataforma duplicada) */}
          {errors.general && (
            <p className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
              {errors.general}
            </p>
          )}

          {/* Feedback visual cuando la actualización fue exitosa */}
          {success && (
            <p className="rounded-[var(--radius-sm)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-2 text-sm text-[var(--color-accent)]">
              {success}
            </p>
          )}

          {/* Campo nombre pre-cargado con el valor actual */}
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
          />

          {/* Selector de plataforma pre-seleccionado con la plataforma actual */}
          <div className="flex flex-col gap-1.5">
            <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
              Plataforma
            </label>
            <select
              className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/70 px-4 text-sm text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              value={form.platform}
              onChange={(e) => handleChange('platform', e.target.value)}
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {errors.platform && (
              <p className="text-xs text-[var(--color-error)]">{errors.platform}</p>
            )}
          </div>

          {/* Campo URL pre-cargado con la URL actual del perfil */}
          <Input
            label="URL real"
            type="url"
            value={form.url}
            onChange={(e) => handleChange('url', e.target.value)}
            error={errors.url}
          />

          {/* Botones: cancelar cierra sin guardar, guardar llama a la API */}
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}