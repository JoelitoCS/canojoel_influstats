"use client";

import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  useCountUp — anima numéricamente de 0 al valor objetivo
//  duration: duración en ms  |  decimals: cifras decimales en la salida
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target, { duration = 900, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start   = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3); // cúbica suave

    const tick = (now) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const current = target * easeOut(elapsed);
      setValue(parseFloat(current.toFixed(decimals)));
      if (elapsed < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);

  return value;
}

// Paleta de variantes: color de icono, fondo del icono y degradado de la barra hover.
const VARIANTS = {
  accent: {
    icon:  "text-[var(--color-accent)]",
    iconBg:"bg-[var(--color-accent-soft)]",
  },
  success: {
    icon:  "text-[var(--color-success)]",
    iconBg:"bg-[var(--color-success-soft)]",
  },
  secondary: {
    icon:  "text-[var(--color-secondary)]",
    iconBg:"bg-[var(--color-secondary-soft)]",
  },
  warning: {
    icon:  "text-[var(--color-warning)]",
    iconBg:"bg-[var(--color-warning-soft)]",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MetricCard
//
//  Props:
//    label      — texto de etiqueta (ej. "Total Seguidores")
//    value      — número a mostrar (numérico o string)
//    suffix     — texto extra al final del valor (ej. "%")
//    icon       — elemento JSX con el SVG del icono
//    variant    — "accent" | "success" | "secondary" | "warning"
//    loading    — muestra skeleton mientras se carga
//    decimals   — cifras decimales en la animación (por defecto 0)
//    formatter  — función opcional para formatear el número final
// ─────────────────────────────────────────────────────────────────────────────
export default function MetricCard({
  label,
  value = 0,
  suffix = "",
  icon,
  variant = "accent",
  loading = false,
  decimals = 0,
  formatter,
}) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
  const animated     = useCountUp(loading ? 0 : numericValue, { decimals });
  const display      = formatter
    ? formatter(animated)
    : animated.toLocaleString("es-ES");
  const theme = VARIANTS[variant] ?? VARIANTS.accent;

  // ── Skeleton mientras carga ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="stat-card surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-20 mt-2" />
          </div>
          <div className="skeleton h-10 w-10 rounded-[var(--radius-sm)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card group surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-xl transition-all duration-300 hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between">
        {/* Bloque izquierdo: etiqueta + valor animado */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
            {display}{suffix}
          </p>
        </div>

        {/* Icono con color de variante + efecto scale al hover */}
        <span
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)]",
            "transition-transform duration-300 group-hover:scale-110",
            theme.iconBg,
            theme.icon,
          ].join(" ")}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
