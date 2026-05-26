"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { authApi } from "@/lib/api";

const getPasswordChecks = (password) => [
  { label: "Mínimo 8 caracteres",  valid: password.length >= 8  },
  { label: "Incluye mayúsculas",   valid: /[A-Z]/.test(password) },
  { label: "Incluye minúsculas",   valid: /[a-z]/.test(password) },
  { label: "Incluye números",      valid: /\d/.test(password)   },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const passwordChecks = getPasswordChecks(form.password);

  const handleChange = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
    setErrors((c) => ({ ...c, [field]: undefined, general: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (!passwordChecks.every((c) => c.valid)) e.password = "La contraseña no cumple los requisitos";
    if (form.passwordConfirm !== form.password) e.passwordConfirm = "Las contraseñas no coinciden";
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      setLoading(true);
      const data = await authApi.register(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.usuario.email);
      router.push("/dashboard");
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const allValid  = passwordChecks.every((c) => c.valid);
  const passScore = passwordChecks.filter((c) => c.valid).length;

  return (
    <AuthCard title="Crear cuenta" subtitle="Prepara tu acceso a InfluStats">
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
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        {/* Medidor de seguridad */}
        {form.password.length > 0 && (
          <div className="animate-fade-in space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-4">
            {/* Barra de progreso */}
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i < passScore
                      ? passScore <= 1
                        ? "var(--color-error)"
                        : passScore <= 2
                          ? "var(--color-warning)"
                          : passScore <= 3
                            ? "var(--color-accent)"
                            : "var(--color-success)"
                      : "var(--color-border)",
                  }}
                />
              ))}
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-1.5">
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className={[
                    "flex items-center gap-2 text-[12px] transition-colors duration-150",
                    check.valid ? "text-[var(--color-success)]" : "text-[var(--color-muted)]",
                  ].join(" ")}
                >
                  <span className={[
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all duration-200",
                    check.valid
                      ? "bg-[var(--color-success-soft)] text-[var(--color-success)] scale-100"
                      : "bg-[var(--color-border)] text-[var(--color-muted)] scale-90",
                  ].join(" ")}>
                    {check.valid ? "✓" : "–"}
                  </span>
                  {check.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={(e) => handleChange("passwordConfirm", e.target.value)}
          error={errors.passwordConfirm}
          placeholder="••••••••"
        />

        <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
          Crear mi cuenta
        </Button>

        <p className="text-center text-[13px] text-[var(--color-muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-accent)] hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
