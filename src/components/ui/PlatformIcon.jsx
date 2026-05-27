// ─────────────────────────────────────────────────────────────────────────────
//  src/components/ui/PlatformIcon.jsx — Logos SVG de redes sociales
//
//  Qué hace:
//    Renderiza el logo oficial (en SVG inline) de Instagram, TikTok, YouTube
//    o Twitch, en el color y tamaño configurables.
//
//  Por qué SVG inline en lugar de imágenes:
//    - Escala perfectamente a cualquier tamaño sin pixelarse
//    - El color se controla con CSS (fill="currentColor" + color en el wrapper)
//    - No hay petición de red extra (se incluye en el bundle de JS)
//    - Se puede animar o cambiar de color con CSS variables o props
//
//  Colores de plataforma:
//    Se definen como variables CSS en globals.css. Así responden al tema
//    claro/oscuro automáticamente si se desea.
//    TikTok es especial: negro en modo claro, blanco en modo oscuro.
//
//  Cómo usar:
//    <PlatformIcon platform="instagram" size={20} />
//    <PlatformIcon platform="youtube" size={16} color="#ff0000" />
// ─────────────────────────────────────────────────────────────────────────────

// Colores de marca de cada plataforma (referenciados como variables CSS en globals.css)
export const PLATFORM_COLORS = {
  instagram: "var(--color-instagram)",
  tiktok:    "var(--color-tiktok)",    // Se invierte según el tema en algunos contextos
  youtube:   "var(--color-youtube)",
  twitch:    "var(--color-twitch)",
};

// Nombres legibles de cada plataforma (para etiquetas, tablas, etc.)
export const PLATFORM_LABELS = {
  instagram: "Instagram",
  tiktok:    "TikTok",
  youtube:   "YouTube",
  twitch:    "Twitch",
};

// ── SVG logos ─────────────────────────────────────────────────────────────────
// Cada logo es un componente que acepta `size` como prop.
// fill="currentColor" → hereda el color del elemento padre (controlado desde fuera)
const LOGOS = {
  // Logo de Instagram: cámara con marco redondeado + círculo + punto de flash
  instagram: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),

  // Logo de TikTok: nota musical estilizada
  tiktok: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
    </svg>
  ),

  // Logo de YouTube: botón de play dentro de un rectángulo redondeado
  youtube: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),

  // Logo de Twitch: globo de chat con bordes angulares
  twitch: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  ),
};

// ── PlatformIcon ──────────────────────────────────────────────────────────────
// Componente principal. Renderiza el logo de la plataforma con el color indicado.
// Si la plataforma no existe en LOGOS devuelve null (no rompe el layout).
export default function PlatformIcon({ platform, size = 20, color }) {
  const Logo = LOGOS[platform?.toLowerCase()];
  if (!Logo) return null;

  // Prioridad de color: prop > PLATFORM_COLORS[platform] > currentColor
  const resolvedColor = color || PLATFORM_COLORS[platform?.toLowerCase()] || "currentColor";

  return (
    // El span establece el color con CSS; el SVG lo hereda con fill="currentColor"
    <span style={{ color: resolvedColor, display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <Logo size={size} />
    </span>
  );
}
