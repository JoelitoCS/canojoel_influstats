/**
 * Button.jsx — Componente de botón reutilizable
 *
 * Props:
 *  - variant: "primary" | "secondary" | "ghost"   (default: "primary")
 *  - size:    "sm" | "md" | "lg"                  (default: "md")
 *  - loading: boolean — muestra spinner y bloquea interacción
 *  - className: clases extra para overrides puntuales
 *  - ...rest: cualquier prop nativa de <button> (onClick, type, disabled…)
 */
"use client";

/* Mapa de estilos por variante */
const VARIANTS = {
  primary: [
    "bg-[var(--color-accent)] text-[#0c0c0f]",
    "hover:bg-[var(--color-accent-dim)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-semibold tracking-wide",
  ].join(" "),

  secondary: [
    "bg-transparent border border-[var(--color-border)] text-[var(--color-text)]",
    "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-muted)]",
    "hover:text-[var(--color-text)] hover:bg-white/5",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),
};

/* Mapa de tamaños */
const SIZES = {
  sm: "h-8  px-4 text-xs  rounded-[var(--radius-sm)]",
  md: "h-11 px-6 text-sm  rounded-[var(--radius-md)]",
  lg: "h-13 px-8 text-base rounded-[var(--radius-md)]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  ...rest
}) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2",
        "transition-all duration-200 ease-out",
        "outline-none cursor-pointer select-none",
        "active:scale-[0.97]",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {/* Spinner animado visible solo cuando loading=true */}
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
