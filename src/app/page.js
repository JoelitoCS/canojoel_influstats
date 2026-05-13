import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

// Mensajes cortos que resumen el estado inicial del proyecto.
const features = [
  "Registro y login conectados",
  "Perfiles sociales por plataforma",
  "Tema claro y oscuro instantaneo",
];

// Home publica con aspecto de producto real y llamadas claras a autenticacion.
export default function Home() {
  return (
    <AppShell>
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-10 py-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="animate-fade-in">
          <p className="w-fit rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            InfluStats
          </p>
          <h1 className="mt-5 max-w-3xl font-[var(--font-display)] text-5xl leading-tight text-[var(--color-text)] sm:text-6xl">
            Controla tus redes desde un panel limpio y rapido.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Registra tus perfiles sociales, valida URLs reales y prepara tus metricas con una interfaz clara, moderna y lista para crecer.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Crear cuenta
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Iniciar sesion
              </Button>
            </Link>
          </div>
        </div>

        <Card className="animate-fade-in">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Estado
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Base lista</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)] text-sm font-black text-[#071018] shadow-[var(--shadow-glow)]">
              IS
            </div>
          </div>

          <div className="grid gap-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:scale-125" />
                <span className="text-sm text-[var(--color-muted)]">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
