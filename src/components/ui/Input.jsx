"use client";

export default function Input({
  label,
  error,
  hint,
  icon,
  rightElement,
  className = "",
  ...rest
}) {
  const borderClass = error
    ? "border-[var(--color-error)] focus-within:ring-[var(--color-error)] focus-within:border-[var(--color-error)]"
    : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]";

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label className="select-none text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </label>
      )}

      <div
        className={[
          "flex h-11 items-center gap-2.5 rounded-[var(--radius-md)] border",
          "bg-[var(--color-surface-strong)] px-4",
          "transition-all duration-150",
          "focus-within:ring-[1.5px] focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]",
          borderClass,
        ].join(" ")}
      >
        {icon && (
          <span className="flex shrink-0 items-center text-[var(--color-muted)]">
            {icon}
          </span>
        )}

        <input
          className={[
            "flex-1 border-none bg-transparent text-sm text-[var(--color-text)]",
            /* outline-none + ring-0 eliminan el doble borde/outline del navegador */
            "outline-none ring-0 focus:outline-none focus:ring-0",
            "placeholder:text-[var(--color-muted)]/70",
            "transition-colors duration-150",
            className,
          ].join(" ")}
          {...rest}
        />

        {rightElement && (
          <span className="flex shrink-0 items-center">{rightElement}</span>
        )}
      </div>

      {error && (
        <p
          className="animate-fade-in flex items-center gap-1.5 text-xs text-[var(--color-error)]"
          role="alert"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm-.5 2.5h1v3h-1v-3zm0 4h1v1h-1v-1z"/>
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}
