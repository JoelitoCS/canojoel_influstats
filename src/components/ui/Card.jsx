// Superficie visual reutilizable para paneles, formularios y bloques de contenido.
export default function Card({ children, className = "" }) {
  return (
    <section
      className={[
        "surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-6 backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
