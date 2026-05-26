// Superficie visual reutilizable — sombra, borde y glassmorphism coherentes.
export default function Card({ children, className = "", hover = true, padding = "p-6" }) {
  return (
    <section
      className={[
        "surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] backdrop-blur-xl",
        padding,
        hover && [
          "hover:border-[var(--color-border-strong)]",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
