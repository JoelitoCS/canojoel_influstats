"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
    setErrors((c) => ({ ...c, [field]: undefined, general: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (form.password.length < 8)  e.password = "Mínimo 8 caracteres";
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const data = await authApi.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.usuario.email);
      localStorage.setItem("userRole", data.usuario.role || "user");
      router.push("/dashboard");
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Bienvenido de nuevo" subtitle="Accede a tu panel de métricas">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {errors.general && (
          <div className="animate-fade-in flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error-soft)] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-error)" className="mt-0.5 shrink-0">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.5 3.5h1v4h-1v-4zm0 5h1v1h-1v-1z"/>
            </svg>
            <p className="text-sm text-[var(--color-error)]">{errors.general}</p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
          placeholder="tu@email.com"
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
          Entrar
        </Button>

        <p className="text-center text-[13px] text-[var(--color-muted)]">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-accent)] hover:underline"
          >
            Regístrate gratis
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
