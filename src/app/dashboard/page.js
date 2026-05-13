"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { profilesApi } from "@/lib/api";
import ProfilesTable from '@/components/ui/ProfilesTable';

// Plataformas permitidas por el CHECK real de la tabla social_profiles.
const platforms = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
];

// Datos placeholder hasta que el backend exponga metricas reales.
const metrics = [
  { label: "Seguidores", value: "0" },
  { label: "Engagement", value: "0%" },
  { label: "Campanas", value: "0" },
];

// Valida URL en cliente para mostrar errores antes de llamar a la API.
const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol) && Boolean(parsedUrl.hostname);
  } catch {
    return false;
  }
};

// Suscripcion minima para leer localStorage de forma compatible con SSR.
const subscribeToStorage = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

// Lee el token del navegador cuando el dashboard se hidrata en cliente.
const getTokenSnapshot = () => localStorage.getItem("token");

// Snapshot usado por Next durante el render del servidor.
const getServerTokenSnapshot = () => null;

// Dashboard protegido con formulario para crear perfiles sociales.
export default function DashboardPage() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToStorage, getTokenSnapshot, getServerTokenSnapshot);
  const [form, setForm] = useState({ name: "", url: "", platform: "instagram" });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
    setSuccess("");
  };

  // Valida campos obligatorios, enum y URL antes de enviar.
  const validate = () => {
    const nextErrors = {};

    if (form.name.trim().length < 2) nextErrors.name = "Introduce un nombre valido";
    if (!isValidUrl(form.url)) nextErrors.url = "Introduce una URL http:// o https:// valida";
    if (!platforms.some((platform) => platform.value === form.platform)) {
      nextErrors.platform = "Selecciona una plataforma valida";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      const data = await profilesApi.create(form);
      setSuccess(data.message || "Perfil social creado correctamente");
      setForm({ name: "", url: "", platform: "instagram" });
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <AppShell>
      <div className="grid gap-6 animate-fade-in">
        <div>
          <p className="w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Panel principal
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl text-[var(--color-text)] sm:text-5xl">
            Tus metricas sociales
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <p className="text-sm font-medium text-[var(--color-muted)]">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Crear perfil social</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Anade una red social con nombre, URL real y plataforma. La API evitara duplicados por plataforma.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {errors.general && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
                {errors.general}
              </p>
            )}

            {success && (
              <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-2 text-sm text-[var(--color-accent)]">
                {success}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                error={errors.name}
                placeholder="Cano Joel"
              />

              <div className="flex w-full flex-col gap-1.5">
                <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
                  Plataforma
                </label>
                <select
                  className={[
                    "h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/70 px-4 text-sm text-[var(--color-text)] outline-none",
                    "transition-all duration-200 focus:-translate-y-0.5 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]",
                    errors.platform ? "border-[var(--color-error)]" : "border-[var(--color-border)]",
                  ].join(" ")}
                  value={form.platform}
                  onChange={(event) => handleChange("platform", event.target.value)}
                >
                  {platforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
                {errors.platform && (
                  <p className="animate-fade-in-up text-xs text-[var(--color-error)]" role="alert">
                    {errors.platform}
                  </p>
                )}
              </div>
            </div>

            <Input
              label="URL real"
              type="url"
              value={form.url}
              onChange={(event) => handleChange("url", event.target.value)}
              error={errors.url}
              placeholder="https://instagram.com/canojoel"
            />

            <Button type="submit" loading={loading} className="w-full sm:w-fit">
              Guardar perfil
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
