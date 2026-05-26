import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

// Plus Jakarta Sans — moderna, geométrica y muy legible en dashboards.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Inter como fallback de sistema — máxima legibilidad en textos pequeños.
const inter = Inter({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "InfluStats — Command Center",
  description: "Plataforma para registrar y analizar métricas sociales.",
};

// Script para aplicar el tema antes de que React hidrate — evita flash.
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
    <html lang="es" data-theme="dark" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
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
