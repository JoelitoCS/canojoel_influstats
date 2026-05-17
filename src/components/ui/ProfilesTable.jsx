'use client';

// Tabla de perfiles sociales con estilo de ranking similar al prototipo.
export default function ProfilesTable({ profiles, onEdit, onDelete }) {
  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-accent-soft)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--color-text)]">Sin perfiles todavía</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Crea tu primer perfil social arriba para empezar a rastrear métricas.
        </p>
      </div>
    );
  }

  // Colores por plataforma para los badges.
  const platformColors = {
    instagram: "var(--color-instagram)",
    tiktok: "var(--color-tiktok)",
    youtube: "var(--color-youtube)",
    twitch: "var(--color-twitch)",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)]">
            <th className="pb-3 pr-4 font-semibold">#</th>
            <th className="pb-3 pr-4 font-semibold">Perfil</th>
            <th className="pb-3 pr-4 font-semibold">Plataforma</th>
            <th className="pb-3 pr-4 font-semibold">URL</th>
            <th className="pb-3 font-semibold">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {profiles.map((profile, index) => (
            <tr
              key={profile.id}
              className="group border-b border-[var(--color-border)]/40 transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              {/* Ranking number */}
              <td className="py-3.5 pr-4">
                <span
                  className={[
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                    index < 3
                      ? "bg-[var(--color-accent)] text-white shadow-[0_0_12px_var(--color-accent-glow)]"
                      : "border border-[var(--color-border)] text-[var(--color-muted)]",
                  ].join(" ")}
                >
                  {index + 1}
                </span>
              </td>

              {/* Username */}
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-secondary-soft)] text-xs font-bold text-[var(--color-secondary)]">
                    {(profile.username || profile.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-[var(--color-text)]">
                    @{profile.username || profile.name}
                  </span>
                </div>
              </td>

              {/* Plataforma con dot de color */}
              <td className="py-3.5 pr-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)]/50 px-3 py-1 text-xs font-medium capitalize">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: platformColors[profile.platform] || "var(--color-muted)" }}
                  />
                  {profile.platform}
                </span>
              </td>

              {/* URL */}
              <td className="py-3.5 pr-4">
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[200px] truncate text-[var(--color-accent)] hover:underline"
                >
                  {profile.url}
                </a>
              </td>

              {/* Acciones */}
              <td className="py-3.5">
                <div className="flex gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(profile)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(profile.id)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/30 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] transition-all hover:bg-[var(--color-error-soft)]"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
