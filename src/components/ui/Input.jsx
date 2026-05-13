"use client";

// Campo de formulario reutilizable con label, hint y estado visual de error.
export default function Input({
  label,
  error,
  hint,
  icon,
  rightElement,
  className = "",
  ...rest
}) {
  // El borde cambia automaticamente cuando el campo tiene error.
  const borderClass = error
    ? "border-[var(--color-error)] focus-within:ring-[var(--color-error)]"
    : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]";

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="select-none text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </label>
      )}

      <div
        className={[
          "flex h-11 items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--color-surface-strong)]/70 px-4",
          "transition-all duration-200 focus-within:-translate-y-0.5 focus-within:ring-1 focus-within:shadow-[var(--shadow-glow)]",
          borderClass,
        ].join(" ")}
      >
        {icon && <span className="flex shrink-0 items-center text-[var(--color-muted)]">{icon}</span>}

        <input
          className={[
            "flex-1 border-none bg-transparent text-sm text-[var(--color-text)] outline-none",
            "placeholder:text-[var(--color-muted)]",
            className,
          ].join(" ")}
          {...rest}
        />

        {rightElement && <span className="flex shrink-0 items-center">{rightElement}</span>}
      </div>

      {error && (
        <p className="animate-fade-in-up text-xs text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}

      {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}
