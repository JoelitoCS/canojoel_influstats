// Superficie visual reutilizable para paneles, formularios y bloques de contenido.
export default function Card({ children, className = "", hover = true }) {
  return (
    <section
      className={[
        "surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-6 backdrop-blur-xl",
        "transition-all duration-300",
        hover && "hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card-hover)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
