"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { authApi } from "@/lib/api";

// Pantalla de login conectada a POST /api/auth/login.
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  // Validacion local para mostrar errores antes de llamar al backend.
  const validate = () => {
    const nextErrors = {};

    if (!form.email.includes("@")) nextErrors.email = "Email invalido";
    if (form.password.length < 8) nextErrors.password = "Minimo 8 caracteres";

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    <AuthCard title="Iniciar sesion" subtitle="Accede a tu panel de metricas">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {errors.general && (
          <p className="animate-fade-in rounded-[var(--radius-sm)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]">
            {errors.general}
          </p>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => handleChange("email", event.target.value)}
          error={errors.email}
          placeholder="tu@email.com"
        />

        <Input
          label="Contrasena"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => handleChange("password", event.target.value)}
          error={errors.password}
          placeholder="Tu contrasena"
        />

        <Button type="submit" loading={loading}>
          Entrar
        </Button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-[var(--color-accent)] hover:underline">
            Registrate
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
