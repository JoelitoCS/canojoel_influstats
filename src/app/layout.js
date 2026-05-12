/**
 * layout.js — RootLayout global de InfluStats
 *
 * Carga las Google Fonts del proyecto (DM Serif Display + DM Sans)
 * e inyecta las variables CSS en el <html>.
 * Todos los children (páginas) heredan este layout.
 */
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

/* --- Fuente display: encabezados y marca --- */
const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/* --- Fuente body: texto general, labels, botones --- */
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "InfluStats — Gestiona tus métricas sociales",
  description:
    "Plataforma para influencers: registra y analiza el rendimiento de tus perfiles en redes sociales.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${dmSerif.variable} ${dmSans.variable} h-full`}
    >
      {/* min-h-full garantiza que el fondo cubra toda la pantalla */}
      <body className="min-h-full flex flex-col font-[var(--font-body)]">
        {children}
      </body>
    </html>
  );
}
