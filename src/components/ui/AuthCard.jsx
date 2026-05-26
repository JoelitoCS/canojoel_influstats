import Card from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

// Variante de Card centrada para las pantallas de autenticación.
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Fondo decorativo con orbes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      {/* Theme toggle en la esquina */}
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <Card
        className="relative z-10 w-full max-w-[420px] animate-fade-in"
        hover={false}
        padding="p-8"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="group mb-4 inline-flex flex-col items-center gap-3">
            <span className={[
              "grid h-12 w-12 place-items-center rounded-[var(--radius-md)]",
              "bg-[var(--color-accent)] text-base font-black text-white",
              "shadow-[0_4px_20px_var(--color-accent-glow)]",
              "transition-transform duration-[var(--transition-spring)]",
              "group-hover:scale-110 group-hover:rotate-[-4deg]",
            ].join(" ")}>
              IS
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">
              InfluStats
            </span>
          </Link>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>

        {children}
      </Card>
    </div>
  );
}
