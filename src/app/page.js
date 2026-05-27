import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import PlatformIcon from "@/components/ui/PlatformIcon";
import styles from "./page.module.css";

const platforms = [
  { key: "instagram", name: "Instagram", detail: "Visualizaciones, likes, guardados y seguidores" },
  { key: "tiktok", name: "TikTok", detail: "Visitas, comentarios, favoritos y compartidos" },
  { key: "youtube", name: "YouTube", detail: "Visitas, likes, suscriptores y miembros" },
  { key: "twitch", name: "Twitch", detail: "Visualizaciones, seguidores, subs y bits" },
];

const capabilities = [
  {
    title: "Dashboard central",
    text: "Consulta seguidores totales, visitas, engagement medio, perfiles activos y avisos de perfiles sin actualizar.",
    stat: "Resumen",
  },
  {
    title: "Métricas semanales",
    text: "Introduce datos por plataforma con campos adaptados y deja que la app calcule engagement y crecimiento.",
    stat: "Auto",
  },
  {
    title: "Rankings",
    text: "Ordena perfiles por seguidores, engagement, crecimiento o visitas para detectar quién destaca en cada red.",
    stat: "Top",
  },
  {
    title: "Comparativas",
    text: "Enfrenta dos perfiles y revisa ganador, diferencias porcentuales, gráficas de barras y radar normalizado.",
    stat: "VS",
  },
  {
    title: "Vistas por plataforma",
    text: "Analiza Instagram, TikTok, YouTube y Twitch con historiales, gráficas y tablas filtradas.",
    stat: "4",
  },
  {
    title: "Panel admin",
    text: "Gestiona usuarios, perfiles y métricas desde una zona protegida para cuentas con rol administrador.",
    stat: "Admin",
  },
];

const workflow = [
  "Crea tu cuenta o inicia sesión.",
  "Registra tus perfiles sociales con su plataforma.",
  "Añade métricas semanales desde Estadísticas.",
  "Compara resultados en dashboard, rankings y gráficas.",
];

const formulas = [
  { platform: "Instagram", formula: "(likes + guardados) / visualizaciones" },
  { platform: "YouTube", formula: "likes / visitas" },
  { platform: "TikTok", formula: "(likes + comentarios + favoritos + compartidos) / visitas" },
  { platform: "Twitch", formula: "suscriptores / seguidores" },
];

export default function Home() {
  return (
    <AppShell>
      <div className={`${styles.homePage} space-y-8`}>
        <section className={`${styles.hero} animate-fade-in`}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              InfluStats
            </span>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] text-[var(--color-text)] sm:text-5xl lg:text-[60px]">
              Todo tu rendimiento social en un solo panel.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              InfluStats te ayuda a registrar perfiles, guardar métricas semanales, calcular engagement, comparar cuentas y descubrir qué plataforma está creciendo mejor.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={`${styles.cta} ${styles.ctaPrimary}`}>
                Crear cuenta gratis
              </Link>
              <Link href="/login" className={`${styles.cta} ${styles.ctaSecondary}`}>
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className={styles.preview} aria-label="Vista previa del dashboard de InfluStats">
            <div className={styles.previewTop}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previewGrid}>
              <div>
                <p>Seguidores</p>
                <strong>248K</strong>
              </div>
              <div>
                <p>Engagement</p>
                <strong>8.72%</strong>
              </div>
              <div>
                <p>Visitas</p>
                <strong>1.9M</strong>
              </div>
            </div>
            <div className={styles.previewChart}>
              <span style={{ height: "42%" }} />
              <span style={{ height: "64%" }} />
              <span style={{ height: "50%" }} />
              <span style={{ height: "78%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "92%" }} />
            </div>
            <div className={styles.previewRows}>
              {platforms.map((platform) => (
                <div key={platform.name}>
                  <span className={styles.rowIcon}>
                    <PlatformIcon platform={platform.key} size={20} />
                  </span>
                  <p>{platform.name}</p>
                  <strong>{platform.name === "TikTok" ? "+18%" : platform.name === "YouTube" ? "+9%" : "+12%"}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platforms.map((platform) => (
            <Card key={platform.name} className="animate-fade-in" padding="p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className={styles.platformIcon}>
                  <PlatformIcon platform={platform.key} size={24} />
                </span>
                <h2 className="text-base font-bold text-[var(--color-text)]">{platform.name}</h2>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{platform.detail}</p>
            </Card>
          ))}
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">Funciones</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              Qué puedes hacer dentro de la web
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((item) => (
              <Card key={item.title} padding="p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-[var(--color-text)]">{item.title}</h3>
                  <span className={styles.statPill}>{item.stat}</span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card padding="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">Flujo de uso</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">De perfil a decisión</h2>
            <div className="mt-6 space-y-3">
              {workflow.map((step, index) => (
                <div key={step} className={styles.step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">Engagement</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">Cálculos adaptados a cada red</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Cada plataforma tiene su propia forma de medir interacción. InfluStats multiplica estos ratios por 100 para mostrarlos como porcentaje.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {formulas.map((item) => (
                <div key={item.platform} className={styles.formula}>
                  <strong>{item.platform}</strong>
                  <code>{item.formula}</code>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
