"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/Input.jsx — Campo de texto reutilizable
//
//  Qué hace:
//    Envuelve un <input> nativo con label, manejo de errores, icono opcional
//    y elemento derecho opcional (ej: botón de mostrar/ocultar contraseña).
//
//  Props:
//    label        — texto de la etiqueta (encima del input)
//    error        — mensaje de error (si existe, pone el borde en rojo)
//    hint         — texto de ayuda (se muestra solo si no hay error)
//    icon         — icono JSX a la izquierda dentro del input
//    rightElement — elemento JSX a la derecha dentro del input
//    className    — clases adicionales para el <input>
//    ...rest      — todos los props nativos de <input> (type, value, onChange, etc.)
//
//  Por qué el borde de error se aplica al wrapper y no al input:
//    El input no tiene borde propio (border-none). El wrapper (el div exterior)
//    tiene el borde. Esto permite incluir el icono y el rightElement dentro
//    del "campo" visualmente, manteniendo un único borde para todo el conjunto.
// ─────────────────────────────────────────────────────────────────────────────

export default function Input({
  label, error, hint, icon, rightElement, className = "", ...rest
}) {
  // Clases del borde: rojo si hay error, azul (acento) al hacer focus si no hay error
  const borderClass = error
    ? "border-[var(--color-error)] focus-within:ring-[var(--color-error)] focus-within:border-[var(--color-error)]"
    : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-[var(--color-accent)]";

  return (
    <div className="flex w-full flex-col gap-2">

      {/* Label: solo se renderiza si se proporciona */}
      {label && (
        <label className="select-none text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          {label}
        </label>
      )}

      {/* Wrapper del input: contiene icono + input + rightElement con un único borde */}
      <div
        className={[
          "flex h-11 items-center gap-2.5 rounded-[var(--radius-md)] border",
          "bg-[var(--color-surface-strong)] px-4",
          "transition-all duration-150",
          // focus-within: se activa cuando cualquier elemento hijo tiene el foco
          "focus-within:ring-[1.5px] focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]",
          borderClass,
        ].join(" ")}
      >
        {/* Icono izquierdo opcional */}
        {icon && (
          <span className="flex shrink-0 items-center text-[var(--color-muted)]">
            {icon}
          </span>
        )}

        {/* Input nativo: sin borde propio (lo gestiona el wrapper) */}
        <input
          className={[
            "flex-1 border-none bg-transparent text-sm text-[var(--color-text)]",
            // outline-none + ring-0: eliminan el doble borde/outline del navegador
            // (el borde del wrapper ya hace esa función visual)
            "outline-none ring-0 focus:outline-none focus:ring-0",
            "placeholder:text-[var(--color-muted)]/70",
            "transition-colors duration-150",
            className,
          ].join(" ")}
          {...rest}   // Pasa type, value, onChange, placeholder, etc. al input nativo
        />

        {/* Elemento derecho opcional (ej: botón de ojo para contraseña) */}
        {rightElement && (
          <span className="flex shrink-0 items-center">{rightElement}</span>
        )}
      </div>

      {/* Mensaje de error: accesible con role="alert" (los lectores de pantalla lo anuncian) */}
      {error && (
        <p
          className="animate-fade-in flex items-center gap-1.5 text-xs text-[var(--color-error)]"
          role="alert"
        >
          {/* Icono de información (círculo con 'i') */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm-.5 2.5h1v3h-1v-3zm0 4h1v1h-1v-1z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Texto de ayuda: solo si no hay error (no mostrar los dos a la vez) */}
      {hint && !error && (
        <p className="text-xs text-[var(--color-muted)]">{hint}</p>
      )}
    </div>
  );
}
