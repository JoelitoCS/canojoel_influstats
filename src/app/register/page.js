"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { authApi } from "@/lib/api";

// Reglas compartidas con el backend para evitar enviar formularios invalidos.
const getPasswordChecks = (password) => [
  { label: "Minimo 8 caracteres", valid: password.length >= 8 },
  { label: "Incluye mayusculas", valid: /[A-Z]/.test(password) },
  { label: "Incluye minusculas", valid: /[a-z]/.test(password) },
  { label: "Incluye numeros", valid: /\d/.test(password) },
];

// Pantalla de registro conectada a POST /api/auth/register.
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const passwordChecks = getPasswordChecks(form.password);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };

  // Validacion visual y previa al envio para dar feedback inmediato.
  const validate = () => {
    const nextErrors = {};
    const passwordIsValid = passwordChecks.every((check) => check.valid);

    if (!form.email.includes("@")) nextErrors.email = "Email invalido";
    if (!passwordIsValid) nextErrors.password = "La contrasena no cumple los requisitos";
    if (form.passwordConfirm !== form.password) {
      nextErrors.passwordConfirm = "Las contrasenas no coinciden";
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

  return (
    <AuthCard title="Crear cuenta" subtitle="Prepara tu acceso a InfluStats">
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
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => handleChange("password", event.target.value)}
          error={errors.password}
          placeholder="Password123"
        />

        <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-3">
          {passwordChecks.map((check) => (
            <p
              key={check.label}
              className={[
                "text-xs transition-colors",
                check.valid ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]",
              ].join(" ")}
            >
              {check.valid ? "OK" : "--"} {check.label}
            </p>
          ))}
        </div>

        <Input
          label="Confirmar contrasena"
          type="password"
          autoComplete="new-password"
          value={form.passwordConfirm}
          onChange={(event) => handleChange("passwordConfirm", event.target.value)}
          error={errors.passwordConfirm}
          placeholder="Repite tu contrasena"
        />

        <Button type="submit" loading={loading}>
          Registrarme
        </Button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
            Inicia sesion
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
