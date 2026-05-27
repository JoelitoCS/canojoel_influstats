"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/ThemeToggle.jsx — Botón de tema claro / oscuro
//
//  Cómo funciona el sistema de temas:
//    El tema se controla con el atributo data-theme en el elemento <html>.
//    globals.css define variables CSS distintas para [data-theme="dark"] y
//    [data-theme="light"], por lo que cambiar el atributo cambia todos los
//    colores instantáneamente sin re-renderizar componentes.
//
//  Qué hace este componente al hacer clic:
//    1. Lee el tema actual de document.documentElement.dataset.theme
//    2. Lo invierte (dark → light, light → dark)
//    3. Lo guarda en localStorage para persistir entre sesiones
//    4. Actualiza el atributo data-theme en <html>
//    5. Emite el evento 'themechange' para que PlatformIcon (TikTok)
//       pueda ajustar sus colores en tiempo real
//
//  Por qué no usa useState para el tema:
//    El tema es global (vive en data-theme del DOM), no es estado de React.
//    Leerlo con useState introduciría un ciclo de re-renderizado innecesario
//    y complicaría la sincronización con el script beforeInteractive del layout.
// ─────────────────────────────────────────────────────────────────────────────

export default function ThemeToggle() {
  const handleToggle = () => {
    // Leer tema actual del DOM (puesto por el script beforeInteractive del layout)
    const currentTheme = document.documentElement.dataset.theme || "dark";
    const nextTheme    = currentTheme === "dark" ? "light" : "dark";

    // Persistir en localStorage para que el script de layout lo recuerde
    localStorage.setItem("theme", nextTheme);

    // Aplicar el tema de forma inmediata (sin re-render de React)
    document.documentElement.dataset.theme = nextTheme;

    // Notificar a otros componentes que escuchan el cambio de tema.
    // Ejemplo: PlatformIcon usa esto para ajustar los colores de TikTok
    // (negro en claro, blanco en oscuro).
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      type="button"
      className={[
        "theme-toggle group relative inline-flex h-9 w-[60px] items-center",
        "rounded-full border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-1",
        "transition-all duration-150",
        "hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1",
        "active:scale-95",
      ].join(" ")}
      onClick={handleToggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      {/* El "knob" (indicador circular) se mueve con CSS transition definida en globals.css */}
      {/* data-theme="dark"  → translateX(0)   (knob a la izquierda)  */}
      {/* data-theme="light" → translateX(28px) (knob a la derecha)   */}
      <span className={[
        "theme-knob relative grid h-7 w-7 place-items-center rounded-full",
        "bg-[var(--color-accent)] text-xs font-bold text-white",
        "shadow-[0_2px_8px_var(--color-accent-glow)]",
        "group-active:scale-90",
      ].join(" ")} />
    </button>
  );
}
