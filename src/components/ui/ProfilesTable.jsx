'use client';

// Tabla que muestra los perfiles sociales del usuario.
// Recibe la lista de perfiles y callbacks para editar/eliminar.
export default function ProfilesTable({ profiles, onEdit, onDelete }) {
  // Si no hay perfiles, mostramos un estado vacío amigable
  if (!profiles || profiles.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted)]">
        Todavía no tienes perfiles sociales. Crea uno arriba.
      </p>
    );
  }

  return (
    // Contenedor con scroll horizontal para pantallas pequeñas
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-widest text-[var(--color-muted)]">
            {/* Columnas visibles en el dashboard */}
            <th className="pb-3 pr-4 font-medium">Plataforma</th>
            <th className="pb-3 pr-4 font-medium">Nombre</th>
            <th className="pb-3 pr-4 font-medium">URL</th>
            <th className="pb-3 font-medium">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {profiles.map((profile) => (
            <tr
              key={profile.id}
              className="border-b border-[var(--color-border)]/50 transition-colors hover:bg-[var(--color-surface-strong)]/40"
            >
              {/* Plataforma con la primera letra en mayúscula */}
              <td className="py-3 pr-4 font-medium capitalize text-[var(--color-text)]">
                {profile.platform}
              </td>

              {/* Nombre de usuario tal como se guardó */}
              <td className="py-3 pr-4 text-[var(--color-text)]">{profile.username}</td>

              {/* URL acortada con enlace que abre en pestaña nueva */}
              <td className="py-3 pr-4">
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[200px] truncate text-[var(--color-accent)] hover:underline"
                >
                  {profile.url}
                </a>
              </td>

              {/* Botones de acción: editar llama onEdit, eliminar llama onDelete */}
              <td className="py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(profile)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(profile.id)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-error)]/40 px-3 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
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