import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

// Features del estado actual del proyecto.
const features = [
  { label: "Registro y login conectados", done: true },
  { label: "Perfiles sociales por plataforma", done: true },
  { label: "Tema claro y oscuro instantáneo", done: true },
  { label: "Sidebar lateral con navegación", done: true },
];

// Plataformas soportadas para mostrar en la landing.
const platformsList = [
  { name: "Instagram", color: "var(--color-instagram)" },
  { name: "TikTok", color: "var(--color-tiktok)" },
  { name: "YouTube", color: "var(--color-youtube)" },
  { name: "Twitch", color: "var(--color-twitch)" },
];

// Home pública con el nuevo diseño.
export default function Home() {
  return (
    <AppShell>
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-10 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fade-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent-glow)]" />
            InfluStats
          </p>

          <h1 className="mt-5 max-w-2xl font-[var(--font-display)] text-4xl leading-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
            Controla tus redes desde un panel limpio y rápido.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-text-secondary)]">
            Registra tus perfiles sociales, valida URLs reales y prepara tus métricas con una interfaz clara, moderna y lista para crecer.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Crear cuenta
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Iniciar sesión
              </Button>
            </Link>
          </div>

          {/* Plataformas soportadas */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Plataformas:
            </span>
            {platformsList.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-xs font-medium backdrop-blur"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color }}
                />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Card de estado */}
        <Card className="animate-fade-in">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Estado
              </p>
              <h2 className="mt-2 text-xl font-semibold">Base lista</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-black text-white shadow-[0_0_20px_var(--color-accent-glow)]">
              IS
            </div>
          </div>

          <div className="grid gap-2.5">
            {features.map((f) => (
              <div
                key={f.label}
                className="group flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/40 p-3.5 transition-all duration-300 hover:border-[var(--color-accent)]/40"
              >
                <span className={[
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs",
                  f.done
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
                ].join(" ")}>
                  {f.done ? "✓" : "…"}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">{f.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
