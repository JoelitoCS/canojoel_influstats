"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/MetricCard.jsx — Tarjeta de métrica con animación countUp
//
//  Qué hace:
//    Muestra una cifra (seguidores, engagement, etc.) con una animación numérica
//    que cuenta desde 0 hasta el valor real. Mientras los datos cargan muestra
//    un skeleton (bloque gris animado).
//
//  Props:
//    label     — texto descriptivo (ej: "Total Seguidores")
//    value     — número a mostrar
//    suffix    — unidad opcional (ej: "%")
//    icon      — elemento JSX del icono SVG
//    variant   — paleta de colores: 'accent' | 'success' | 'secondary' | 'warning'
//    loading   — si true, muestra el skeleton en lugar del valor
//    decimals  — decimales a mostrar en la animación (0 para enteros)
//    formatter — función opcional para formatear el número (ej: 125000 → "125k")
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

// ── useCountUp ────────────────────────────────────────────────────────────────
// Hook personalizado que anima un número de 0 hasta `target`.
//
// Cómo funciona:
//   - requestAnimationFrame llama a `tick` en cada frame del navegador (~60fps)
//   - Calcula el tiempo transcurrido (elapsed) como fracción de `duration`
//   - Aplica una función de easing (cubic-out) para que desacelere al final
//   - Cuando elapsed llega a 1 (fin de la animación), para el bucle
//
// easeOut cubic: t => 1 - (1-t)^3
//   En t=0: valor = 0; en t=0.5: valor ≈ 87.5% del target; en t=1: valor = 100%
//   Da sensación de "arrancada rápida + frenada suave"
function useCountUp(target, { duration = 1000, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const raf = useRef(null); // Referencia al ID del requestAnimationFrame (para cancelar)

  useEffect(() => {
    if (target === 0) { setValue(0); return; }

    const start   = performance.now(); // Timestamp de inicio de la animación
    const easeOut = (t) => 1 - Math.pow(1 - t, 3); // Función de easing cubic-out

    const tick = (now) => {
      const elapsed = Math.min((now - start) / duration, 1); // 0 a 1
      const current = target * easeOut(elapsed);             // Valor actual
      setValue(parseFloat(current.toFixed(decimals)));
      if (elapsed < 1) raf.current = requestAnimationFrame(tick); // Continuar animación
    };

    raf.current = requestAnimationFrame(tick);
    // Limpiar al desmontar el componente o al cambiar el target
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);

  return value;
}

// ── VARIANTS ──────────────────────────────────────────────────────────────────
// Paleta de colores por variante. Cada variante define:
//   icon   → color del icono (texto)
//   iconBg → fondo del contenedor del icono
//   glow   → color del "glow" que aparece al hover
//   bar    → color de la barra de progreso (no usada aquí, reservada para extensiones)
const VARIANTS = {
  accent:    { icon: "text-[var(--color-accent)]",    iconBg: "bg-[var(--color-accent-soft)]",    glow: "var(--color-accent-glow)" },
  success:   { icon: "text-[var(--color-success)]",   iconBg: "bg-[var(--color-success-soft)]",   glow: "rgba(16, 185, 129, 0.20)" },
  secondary: { icon: "text-[var(--color-secondary)]", iconBg: "bg-[var(--color-secondary-soft)]", glow: "rgba(6, 182, 212, 0.20)" },
  warning:   { icon: "text-[var(--color-warning)]",   iconBg: "bg-[var(--color-warning-soft)]",   glow: "rgba(245, 158, 11, 0.20)" },
};

export default function MetricCard({
  label, value = 0, suffix = "", icon,
  variant = "accent", loading = false, decimals = 0, formatter,
}) {
  // Asegurar que value sea un número válido
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;

  // useCountUp: cuando loading es true pasamos 0 (la animación se reiniciará al cargar)
  const animated = useCountUp(loading ? 0 : numericValue, { decimals });

  // Formatear el número: si hay formatter lo usamos (ej: 125000 → "125k")
  // Si no, usamos toLocaleString para separadores de miles locales (ej: "125.000")
  const display = formatter
    ? formatter(animated)
    : animated.toLocaleString("es-ES");

  const theme = VARIANTS[variant] ?? VARIANTS.accent;

  // ── Skeleton (estado de carga) ────────────────────────────────────────────
  // Muestra bloques grises animados mientras los datos llegan de la API
  if (loading) {
    return (
      <div className="stat-card surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3 pt-1">
            <div className="skeleton h-2.5 w-20 rounded-full" />  {/* Label */}
            <div className="skeleton h-8 w-24 rounded-[var(--radius-sm)]" />  {/* Valor */}
          </div>
          <div className="skeleton h-11 w-11 rounded-[var(--radius-md)]" />  {/* Icono */}
        </div>
      </div>
    );
  }

  return (
    <div className={[
      "stat-card group surface-glow",
      "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
      "bg-[var(--color-surface)] p-5 backdrop-blur-xl cursor-default",
    ].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        {/* Label + valor animado */}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-2.5 text-[28px] font-bold leading-none tabular-nums text-[var(--color-text)]">
            {display}{suffix}
          </p>
        </div>

        {/* Contenedor del icono: escala al hacer hover en la card */}
        <span
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
            "transition-all duration-[var(--transition-spring)]",
            "group-hover:scale-110",
            theme.iconBg, theme.icon,
          ].join(" ")}
          style={{ boxShadow: `0 0 0 0 ${theme.glow}` }}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
