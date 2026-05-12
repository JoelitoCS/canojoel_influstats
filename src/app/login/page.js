"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AuthCard from "@/components/ui/AuthCard";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados de validación
  const [errors, setErrors] = useState({});

  // Manejar envío
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    const newErrors = {};
    if (!email.includes("@")) newErrors.email = "Email inválido";
    if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Llamada al backend
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrors({ general: data.message });
      return;
    }

    // Guardar token
    localStorage.setItem("token", data.token);

    // Redirigir al dashboard
    router.push("/dashboard");
  };

  return (
    <AuthCard title="Iniciar Sesión">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        
        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <Button type="submit">Entrar</Button>

        <p className="text-gray-400 text-sm text-center mt-2">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Regístrate
          </a>
        </p>
      </form>
    </AuthCard>
  );
}
