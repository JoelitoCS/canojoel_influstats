"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/Button.jsx — Botón reutilizable con variantes
//
//  Qué hace:
//    Botón estilizado con cuatro variantes de color (primary, secondary, ghost,
//    danger) y tres tamaños (sm, md, lg). Cuando loading=true muestra un
//    spinner y se deshabilita automáticamente.
//
//  Props:
//    children  — texto o contenido del botón
//    variant   — 'primary' | 'secondary' | 'ghost' | 'danger'  (default: 'primary')
//    size      — 'sm' | 'md' | 'lg'                             (default: 'md')
//    loading   — boolean: muestra spinner y deshabilita          (default: false)
//    className — clases Tailwind adicionales
//    ...rest   — cualquier otro prop de <button> (onClick, type, disabled, etc.)
//
//  Por qué las variantes están como strings concatenados:
//    Tailwind necesita las clases como strings literales en el código fuente
//    para incluirlas en el build. No se pueden construir dinámicamente
//    (ej: `text-${color}`) porque el compilador no las detecta.
// ─────────────────────────────────────────────────────────────────────────────

// Estilos completos por variante (todos los estados: normal, hover, active, focus, disabled)
const VARIANTS = {
  // primary: botón principal (color de acento violeta)
  primary: [
    "btn-ripple",                          // Clase de globals.css: efecto ripple al hacer clic
    "bg-[var(--color-accent)] text-white",
    "hover:bg-[var(--color-accent-dim)]",
    "shadow-[0_2px_12px_var(--color-accent-glow)]",
    "hover:shadow-[0_4px_20px_var(--color-accent-glow)]",
    "hover:-translate-y-0.5",             // Ligero levantamiento al hover
    "active:translate-y-0 active:scale-[0.98]", // "presión" al hacer clic
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
    "font-semibold tracking-wide",
  ].join(" "),

  // secondary: botón secundario (borde + fondo transparente)
  secondary: [
    "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur",
    "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
    "hover:-translate-y-0.5",
    "active:translate-y-0 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),

  // ghost: botón fantasma (solo texto, sin borde ni fondo)
  ghost: [
    "bg-transparent text-[var(--color-muted)]",
    "hover:text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]",
    "active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),

  // danger: botón de acción destructiva (rojo)
  danger: [
    "btn-ripple",
    "bg-[var(--color-error)] text-white",
    "hover:brightness-110",
    "shadow-[0_2px_10px_rgba(239,68,68,0.25)]",
    "hover:-translate-y-0.5",
    "active:translate-y-0 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-semibold",
  ].join(" "),
};

// Tamaños: altura, padding horizontal y tamaño de fuente
const SIZES = {
  sm: "h-8 px-4 text-xs rounded-[var(--radius-sm)]",
  md: "h-10 px-5 text-sm rounded-[var(--radius-md)]",
  lg: "h-12 px-7 text-[15px] rounded-[var(--radius-md)]",
};

export default function Button({
  children,
  variant   = "primary",
  size      = "md",
  loading   = false,
  className = "",
  ...rest   // onClick, type, disabled, etc.
}) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2",
        "transition-all duration-[var(--transition-slow,200ms)] ease-out",
        "outline-none cursor-pointer select-none",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size],
        className,
      ].join(" ")}
      // Si loading=true, el botón queda deshabilitado (no se puede pulsar)
      disabled={loading || rest.disabled}
      {...rest}
    >
      {/* Spinner SVG: solo visible cuando loading=true */}
      {loading && (
        <svg
          className="h-4 w-4 shrink-0"
          style={{ animation: "spin 0.8s linear infinite" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"   // Oculto para lectores de pantalla (no aporta información)
        >
          {/* Círculo de fondo (opaco al 25%) */}
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          {/* Arco giratorio (opaco al 75%) */}
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
