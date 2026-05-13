import Card from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Variante de Card centrada para las pantallas de autenticacion.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-[var(--color-text)]">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            InfluStats
          </p>
          <h1 className="font-[var(--font-display)] text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-[var(--color-muted)]">{subtitle}</p>}
        </div>
        {children}
      </Card>
    </div>
  );
}
