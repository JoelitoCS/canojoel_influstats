"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (form.name.length < 3) newErrors.name = "Nombre muy corto";
    if (!form.email.includes("@")) newErrors.email = "Email inválido";
    if (form.password.length < 6) newErrors.password = "Mínimo 6 caracteres";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrors({ general: data.message });
      return;
    }

    router.push("/login");
  };

  return (
    <AuthCard title="Crear Cuenta">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        
        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <Input
          label="Nombre"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
        />

        <Input
          label="Email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
        />

        <Input
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={errors.password}
        />

        <Button type="submit">Registrarme</Button>

        <p className="text-gray-400 text-sm text-center mt-2">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Inicia sesión
          </a>
        </p>
      </form>
    </AuthCard>
  );
}
