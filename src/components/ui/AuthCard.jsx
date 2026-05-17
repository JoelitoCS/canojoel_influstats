import Card from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

// Variante de Card centrada para las pantallas de autenticación.
// Mantiene la sidebar oculta y muestra un diseño centrado con fondo atmosférico.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-[var(--color-text)]">
      {/* Fondo decorativo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-[var(--color-accent)]/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-[var(--color-secondary)]/5 blur-[100px]" />
      </div>

      <div className="absolute right-5 top-5 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md animate-fade-in" hover={false}>
        <div className="mb-6 text-center">
          <Link href="/" className="group mb-3 inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-black text-white shadow-[0_0_16px_var(--color-accent-glow)] transition-transform duration-300 group-hover:scale-105">
              IS
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              InfluStats
            </span>
          </Link>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>
        {children}
      </Card>
    </div>
  );
}
