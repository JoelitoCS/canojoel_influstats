// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/Card.jsx — Contenedor de superficie reutilizable
//
//  Qué hace:
//    Envuelve cualquier contenido en una "tarjeta" con borde, fondo translúcido
//    (glassmorphism), esquinas redondeadas y sombra al hover.
//    Se usa en el dashboard, métricas, admin y ranking para agrupar secciones.
//
//  Props:
//    children  — contenido interno
//    className — clases Tailwind adicionales (para casos especiales)
//    hover     — si true (por defecto) añade efecto hover: borde más oscuro + sombra
//    padding   — clase de padding (por defecto "p-6")
//
//  Por qué usa <section>:
//    <section> es más semántico que <div> para delimitar bloques de contenido
//    relacionado. Los lectores de pantalla lo interpretan correctamente.
// ─────────────────────────────────────────────────────────────────────────────

export default function Card({ children, className = "", hover = true, padding = "p-6" }) {
  return (
    <section
      className={[
        // surface-glow: clase de globals.css que añade un sutil resplandor interior
        "surface-glow rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        // backdrop-blur-xl: efecto glassmorphism (el fondo se difumina detrás de la card)
        "bg-[var(--color-surface)] backdrop-blur-xl",
        padding,
        // Efectos hover opcionales: borde más oscuro, sombra elevada, ligero movimiento
        hover && [
          "hover:border-[var(--color-border-strong)]",
          "hover:shadow-[var(--shadow-card-hover)]",
          "hover:-translate-y-[1px]",
        ].join(" "),
        className,
      ]
        .filter(Boolean)   // Eliminar false/undefined si hover=false
        .join(" ")}
    >
      {children}
    </section>
  );
}
