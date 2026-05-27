// ─────────────────────────────────────────────────────────────────────────────
//  src/app/layout.js — Layout raíz de Next.js (App Router)
//
//  Qué es el layout raíz:
//    En Next.js App Router, layout.js es el componente que envuelve TODAS las
//    páginas de la aplicación. Es el equivalente al <html> y <body> en HTML.
//    Solo se renderiza una vez; las páginas se insertan dentro de {children}.
//
//  Qué hace este archivo:
//    1. Carga las fuentes de Google Fonts (Plus Jakarta Sans + Inter)
//    2. Define los metadatos de la página (title, description para SEO)
//    3. Inyecta un script que aplica el tema (claro/oscuro) ANTES de que
//       React hidrate, evitando el "flash" de tema incorrecto al cargar.
// ─────────────────────────────────────────────────────────────────────────────

import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// ── Carga de fuentes con next/font ────────────────────────────────────────────
// next/font descarga y optimiza las fuentes en el build, evitando peticiones
// externas en tiempo de ejecución. Las fuentes se sirven desde el propio servidor.
// variable: nombre de la variable CSS que usaremos en globals.css y en los componentes.

// Plus Jakarta Sans: fuente principal del dashboard. Geométrica y moderna.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",           // var(--font-body) en CSS
  subsets:  ["latin"],
  weight:   ["300", "400", "500", "600", "700", "800"],
  display:  "swap",                  // Muestra texto con fuente del sistema mientras carga
});

// Inter: fuente secundaria. Se usa como alternativa en elementos pequeños.
const inter = Inter({
  variable: "--font-mono",           // var(--font-mono) en CSS
  subsets:  ["latin"],
  weight:   ["400", "500", "600"],
  display:  "swap",
});

// ── Metadatos de la página ────────────────────────────────────────────────────
// Next.js usa este objeto para generar las etiquetas <title> y <meta> del HTML.
// Aparecen en la pestaña del navegador y en los resultados de búsqueda (SEO).
export const metadata = {
  title:       "InfluStats — Command Center",
  description: "Plataforma para registrar y analizar métricas sociales.",
};

// ── Script de tema (beforeInteractive) ───────────────────────────────────────
// PROBLEMA: React hidrata el componente después de que el HTML ya se muestra.
// Si el tema se aplicara con useEffect, habría un "flash" (la página aparece
// en modo oscuro, luego cambia a claro, o viceversa) al cargar.
//
// SOLUCIÓN: inyectar un <script> con strategy="beforeInteractive" que se ejecuta
// ANTES de que React tome el control. Lee el tema guardado en localStorage y lo
// aplica inmediatamente al atributo data-theme del elemento <html>.
//
// Por qué data-theme en <html>:
//   El sistema de temas usa selectores CSS como [data-theme="dark"] .clase { … }
//   Al cambiar el atributo en <html>, todos los estilos cambian sin re-renderizar.
const themeScript = `
  try {
    const storedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = storedTheme || systemTheme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
`;

// ── RootLayout ────────────────────────────────────────────────────────────────
// Componente que envuelve toda la app. {children} es la página activa.
export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: elimina la advertencia de React cuando el servidor
    // y el cliente tienen valores distintos en data-theme (el script lo cambia antes).
    // lang="es": indica el idioma para accesibilidad y SEO.
    <html lang="es" data-theme="dark" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>

        {/* Script de tema: se ejecuta antes de React para evitar el flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />

        {/* children: aquí se renderiza la página activa (dashboard, login, etc.) */}
        {children}
      </body>
    </html>
  );
}
