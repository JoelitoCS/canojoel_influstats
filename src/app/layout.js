import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

// Fuente decorativa para marca y titulares.
const dmSerif = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Fuente principal para formularios, navegacion y texto general.
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Metadatos globales usados por Next en todas las rutas.
export const metadata = {
  title: "InfluStats",
  description: "Plataforma para registrar y analizar metricas sociales.",
};

// Script minimo para aplicar el tema antes de que React hidrate la pagina.
const themeScript = `
  try {
    const storedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = storedTheme || systemTheme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
`;

// RootLayout aplica fuentes y estilos globales a todo el App Router.
export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen font-[var(--font-body)] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
