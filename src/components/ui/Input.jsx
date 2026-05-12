/**
 * Input.jsx — Componente de campo de formulario reutilizable
 *
 * Props:
 *  - label:       string  — texto del <label> visible
 *  - error:       string  — mensaje de error (si existe, pone el borde rojo)
 *  - hint:        string  — texto de ayuda gris bajo el campo
 *  - icon:        ReactNode — icono SVG a la izquierda del input
 *  - rightElement: ReactNode — elemento a la derecha (ej: botón "mostrar contraseña")
 *  - className:   string  — clases extra
 *  - ...rest:     props nativas de <input> (type, placeholder, value, onChange…)
 */
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
  /* El borde cambia a rojo si hay un mensaje de error */
  const borderClass = error
    ? "border-[var(--color-error)] focus-within:ring-[var(--color-error)]"
    : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label visible (se oculta si no se pasa) */}
      {label && (
        <label className="text-xs font-medium tracking-widest uppercase text-[var(--color-muted)] select-none">
          {label}
        </label>
      )}

      {/* Wrapper que agrupa icono + input + rightElement */}
      <div
        className={[
          "flex items-center gap-2",
          "bg-[var(--color-surface)] border rounded-[var(--radius-md)]",
          "px-4 h-11",
          "transition-all duration-200",
          "focus-within:ring-1",
          borderClass,
        ].join(" ")}
      >
        {/* Icono izquierdo opcional */}
        {icon && (
          <span className="text-[var(--color-muted)] shrink-0 flex items-center">
            {icon}
          </span>
        )}

        {/* El input propiamente — sin borde propio, lo gestiona el wrapper */}
        <input
          className={[
            "flex-1 bg-transparent text-sm text-[var(--color-text)]",
            "placeholder:text-[var(--color-muted)]",
            "outline-none border-none",
            className,
          ].join(" ")}
          {...rest}
        />

        {/* Elemento derecho opcional (ej: ojo para contraseña) */}
        {rightElement && (
          <span className="shrink-0 flex items-center">{rightElement}</span>
        )}
      </div>

      {/* Mensaje de error — aparece con animación si hay error */}
      {error && (
        <p
          className="text-xs text-[var(--color-error)] animate-fade-in-up"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Hint informativo (solo se muestra si no hay error) */}
      {hint && !error && (
        <p className="text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}
