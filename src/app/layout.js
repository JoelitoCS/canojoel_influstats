import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// Fuente display para titulares — con personalidad y elegancia.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// Fuente body moderna geométrica — excelente legibilidad en dashboards.
const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Metadatos globales.
export const metadata = {
  title: "InfluStats",
  description: "Plataforma para registrar y analizar métricas sociales.",
};

// Script para aplicar el tema antes de que React hidrate.
const themeScript = `
  try {
    const storedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = storedTheme || systemTheme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="min-h-screen font-[var(--font-body)] antialiased">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
