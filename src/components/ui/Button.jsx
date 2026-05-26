"use client";

// Estilos por variante con paleta violeta/cyan.
const VARIANTS = {
  primary: [
    "btn-ripple",
    "bg-[var(--color-accent)] text-white",
    "hover:bg-[var(--color-accent-dim)]",
    "shadow-[0_2px_12px_var(--color-accent-glow)]",
    "hover:shadow-[0_4px_20px_var(--color-accent-glow)]",
    "hover:-translate-y-0.5",
    "active:translate-y-0 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
    "font-semibold tracking-wide",
  ].join(" "),

  secondary: [
    "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] backdrop-blur",
    "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
    "hover:-translate-y-0.5",
    "active:translate-y-0 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-muted)]",
    "hover:text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]",
    "active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "font-medium",
  ].join(" "),

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

const SIZES = {
  sm: "h-8 px-4 text-xs rounded-[var(--radius-sm)]",
  md: "h-10 px-5 text-sm rounded-[var(--radius-md)]",
  lg: "h-12 px-7 text-[15px] rounded-[var(--radius-md)]",
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
        "transition-all duration-[var(--transition-slow,200ms)] ease-out",
        "outline-none cursor-pointer select-none",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size],
        className,
      ].join(" ")}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <svg
          className="h-4 w-4 shrink-0"
          style={{ animation: "spin 0.8s linear infinite" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
