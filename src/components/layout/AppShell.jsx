"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Iconos SVG inline para el sidebar — evita dependencias externas.
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  rankings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  explore: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
  twitch: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" />
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

// Secciones del sidebar con separadores de grupo.
const navSections = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/dashboard/rankings", label: "Rankings", icon: "rankings" },
      { href: "/dashboard/explore", label: "Explorar", icon: "explore" },
    ],
  },
  {
    title: "PLATAFORMAS",
    items: [
      { href: "/dashboard/tiktok", label: "TikTok", icon: "tiktok" },
      { href: "/dashboard/instagram", label: "Instagram", icon: "instagram" },
      { href: "/dashboard/twitch", label: "Twitch", icon: "twitch" },
      { href: "/dashboard/youtube", label: "YouTube", icon: "youtube" },
    ],
  },
];

// Suscripcion minima al storage para detectar cambios de sesion.
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken = () => localStorage.getItem("token");
const getEmail = () => localStorage.getItem("userEmail") || "Mi cuenta";
const serverSnap = () => null;
const serverEmail = () => "Mi cuenta";

const getAvatarLetter = (email) => {
  const ch = String(email || "U").trim().charAt(0);
  return ch ? ch.toUpperCase() : "U";
};

// Layout principal con sidebar lateral fijo y area de contenido scrollable.
export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeStorage, getToken, serverSnap);
  const userEmail = useSyncExternalStore(subscribeStorage, getEmail, serverEmail);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarLetter = getAvatarLetter(userEmail);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "userEmail", newValue: null }));
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Overlay móvil ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={[
          "fixed top-0 left-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col",
          "bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)]",
          "border-r border-[var(--color-sidebar-border)]",
          "shadow-[var(--shadow-sidebar)]",
          "transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-sidebar-border)] px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-black text-white shadow-[0_0_16px_var(--color-accent-glow)]">
            IS
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-sidebar-text-active)]">
              InfluStats
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-sidebar-text)]/60">
              Command Center
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-6" : ""}>
              {section.title && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-sidebar-text)]/50">
                  {section.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={[
                        "relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium",
                        "transition-all duration-200",
                        isActive
                          ? "bg-[var(--color-sidebar-accent)] text-[var(--color-sidebar-text-active)]"
                          : "hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-text-active)]",
                      ].join(" ")}
                    >
                      {isActive && <span className="nav-active-indicator" />}
                      <span className={isActive ? "text-[var(--color-accent)]" : ""}>
                        {icons[item.icon]}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Perfil de usuario en la parte inferior */}
        {token && (
          <div className="border-t border-[var(--color-sidebar-border)] p-3">
            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white shadow-[0_0_12px_var(--color-accent-glow)]">
                {avatarLetter}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-sidebar-text-active)]">
                  {userEmail}
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
                  Pro Tier
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-[var(--color-sidebar-text)] transition-all duration-200 hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-error)]"
            >
              {icons.logout}
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex flex-1 flex-col lg:pl-[var(--sidebar-width)]">
        {/* Header top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            {/* Hamburger móvil */}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)] lg:hidden"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {sidebarOpen ? icons.close : icons.menu}
            </button>

            {/* Barra de búsqueda */}
            <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/60 px-4 py-2 text-sm text-[var(--color-muted)] sm:flex">
              {icons.explore}
              <span>Buscar perfiles, nichos o tags...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {!token && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                >
                  Registro
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
