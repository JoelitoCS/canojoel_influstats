import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const features = [
  { label: "Registro y login conectados",       done: true  },
  { label: "Perfiles sociales por plataforma",  done: true  },
  { label: "Tema claro y oscuro instantáneo",   done: true  },
  { label: "Sidebar lateral con navegación",    done: true  },
];

const platformsList = [
  { name: "Instagram", color: "var(--color-instagram)" },
  { name: "TikTok",    color: "var(--color-tiktok)"    },
  { name: "YouTube",   color: "var(--color-youtube)"   },
  { name: "Twitch",    color: "var(--color-twitch)"    },
];

export default function Home() {
  return (
    <AppShell>
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Hero copy ── */}
        <div className="animate-fade-in">
          {/* Badge */}
          <span className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5",
            "border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]",
            "text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]",
          ].join(" ")}>
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            InfluStats Beta
          </span>

          {/* Headline */}
          <h1 className={[
            "mt-6 max-w-2xl text-4xl font-bold leading-[1.15] tracking-tight text-[var(--color-text)]",
            "sm:text-5xl lg:text-[56px]",
          ].join(" ")}>
            Controla tus redes desde un{" "}
            <span className="gradient-text">panel limpio</span>{" "}
            y rápido.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
            Registra tus perfiles sociales, valida URLs reales y analiza tus métricas con una interfaz moderna y lista para crecer.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Crear cuenta gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Iniciar sesión
              </Button>
            </Link>
          </div>

          {/* Plataformas */}
          <div className="mt-10 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Plataformas:
            </span>
            {platformsList.map((p) => (
              <span
                key={p.name}
                className={[
                  "inline-flex items-center gap-2 rounded-full",
                  "border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5",
                  "text-xs font-semibold backdrop-blur",
                  "transition-all duration-150 hover:border-[var(--color-border-strong)] hover:-translate-y-0.5",
                ].join(" ")}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* ── Card de estado ── */}
        <Card className="animate-fade-in stagger-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Estado del proyecto
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">Base lista ✓</h2>
            </div>
            <div className={[
              "grid h-12 w-12 place-items-center rounded-[var(--radius-md)]",
              "bg-[var(--color-accent)] text-sm font-black text-white",
              "shadow-[0_4px_20px_var(--color-accent-glow)]",
              "transition-transform duration-[var(--transition-spring)] hover:scale-105 hover:rotate-[-3deg]",
            ].join(" ")}>
              IS
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {features.map((f, i) => (
              <div
                key={f.label}
                className={[
                  "flex items-center gap-3 rounded-[var(--radius-sm)]",
                  "border border-[var(--color-border)] bg-[var(--color-surface-strong)]/50 p-3.5",
                  "transition-all duration-150",
                  "hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)]/50",
                  "animate-fade-in",
                ].join(" ")}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={[
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  f.done
                    ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
                ].join(" ")}>
                  {f.done ? "✓" : "…"}
                </span>
                <span className="text-[13px] text-[var(--color-text-secondary)]">{f.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
