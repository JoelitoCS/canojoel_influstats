"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GlobalSearch from "@/components/ui/GlobalSearch";

const icons = {
  dashboard: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  grid:      (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  rankings:  (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>),
  trophy:    (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>),
  explore:   (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>),
  compare:   (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>),
  instagram: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>),
  tiktok:    (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>),
  twitch:    (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></svg>),
  youtube:   (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" /></svg>),
  profile:   (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  logout:    (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>),
  menu:      (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>),
  close:     (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>),
  admin:     (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  vs:        (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 21M16 3l4 18M3 9h18M3 15h18" /></svg>),
};

const navSections = [
  {
    items: [
      { href: "/dashboard",             label: "Dashboard",    icon: "dashboard" },
      { href: "/dashboard/rankings",    label: "Ranking",      icon: "trophy"    },
      { href: "/dashboard/metrics",     label: "Estadísticas", icon: "rankings"  },
      { href: "/dashboard/compare",     label: "Comparativa",  icon: "compare"   },
      { href: "/dashboard/comparar",    label: "VS Perfiles",  icon: "vs"        },
      { href: "/dashboard/explore",     label: "Explorar",     icon: "explore"   },
      { href: "/dashboard/profile/me",  label: "Mi Perfil",    icon: "profile"   },
    ],
  },
  {
    title: "Plataformas",
    items: [
      { href: "/dashboard/plataformas", label: "Todas",     icon: "grid"      },
      { href: "/dashboard/instagram",   label: "Instagram", icon: "instagram" },
      { href: "/dashboard/tiktok",      label: "TikTok",    icon: "tiktok"    },
      { href: "/dashboard/twitch",      label: "Twitch",    icon: "twitch"    },
      { href: "/dashboard/youtube",     label: "YouTube",   icon: "youtube"   },
    ],
  },
];

const subscribeStorage = (cb) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const getToken    = () => localStorage.getItem("token");
const getEmail    = () => localStorage.getItem("userEmail") || "Mi cuenta";
const getRole     = () => localStorage.getItem("userRole")  || "user";
const serverSnap  = () => null;
const serverEmail = () => "Mi cuenta";
const getAvatarLetter = (email) => { const ch = String(email || "U").trim().charAt(0); return ch ? ch.toUpperCase() : "U"; };

/* ── NavItem ─────────────────────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <div className="relative">
      {isActive && (
        <span aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-[var(--color-accent)]"
          style={{ height: "56%", animation: "slide-in-left 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }} />
      )}
      <Link href={item.href} onClick={onClick}
        className={["flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 min-h-[44px]", "text-[13px] font-medium transition-all duration-150",
          isActive ? "bg-[var(--color-sidebar-accent)] text-[var(--color-sidebar-text-active)]"
                   : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-text-active)]",
        ].join(" ")}
      >
        <span className={isActive ? "text-[var(--color-accent)]" : ""}>{icons[item.icon]}</span>
        {item.label}
      </Link>
    </div>
  );
}

/* ── NavContent ─────────────────────────────────────────────────────────── */
function NavContent({ closeSidebar, userRole }) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const isItemActive = (href) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath !== pathname) return false;
    if (!hrefQuery) return !searchParams.toString();
    const params = new URLSearchParams(hrefQuery);
    for (const [k, v] of params.entries()) { if (searchParams.get(k) !== v) return false; }
    return true;
  };
  return (
    <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Navegación principal">
      {navSections.map((section, si) => (
        <div key={si}>
          {section.title && (
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-sidebar-text)]/40">{section.title}</p>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItem key={item.href} item={item} isActive={isItemActive(item.href)} onClick={closeSidebar} />
            ))}
          </div>
        </div>
      ))}
      {userRole === "admin" && (
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-sidebar-text)]/40">Admin</p>
          <div className="flex flex-col gap-0.5">
            <NavItem item={{ href: "/dashboard/admin", label: "Panel Admin", icon: "admin" }} isActive={isItemActive("/dashboard/admin")} onClick={closeSidebar} />
          </div>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AppShell — layout principal
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AppShell({ children }) {
  const router       = useRouter();
  const token        = useSyncExternalStore(subscribeStorage, getToken, serverSnap);
  const userEmail    = useSyncExternalStore(subscribeStorage, getEmail, serverEmail);
  const userRole     = useSyncExternalStore(subscribeStorage, getRole, serverSnap);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarLetter = getAvatarLetter(userEmail);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("userEmail"); localStorage.removeItem("userRole");
    window.dispatchEvent(new StorageEvent("storage", { key: "token",     newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "userEmail", newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "userRole",  newValue: null }));
    router.push("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          style={{ animation: "fade-up 0.18s ease both" }} onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* ══════ SIDEBAR ══════ */}
      <aside className={["fixed top-0 left-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col",
        "bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)] shadow-[var(--shadow-sidebar)]",
        "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")} aria-label="Barra de navegación lateral">

        <Link href="/" onClick={closeSidebar}
          className="flex h-[60px] items-center gap-3 border-b border-[var(--color-sidebar-border)] px-4 transition-colors hover:bg-[var(--color-sidebar-accent)] sm:px-5">
          <span className={["grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)]",
            "bg-[var(--color-accent)] text-sm font-black text-white shadow-[0_2px_12px_var(--color-accent-glow)]",
            "transition-transform duration-[var(--transition-spring)] hover:scale-110 hover:rotate-[-3deg]"].join(" ")}>
            IS
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[var(--color-sidebar-text-active)]">InfluStats</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-sidebar-text)]/50">Command Center</p>
          </div>
        </Link>

        <Suspense fallback={<div className="flex-1" />}>
          <NavContent closeSidebar={closeSidebar} userRole={userRole} />
        </Suspense>

        {token && (
          <div className="border-t border-[var(--color-sidebar-border)] p-3 space-y-0.5">
            <Link href="/dashboard/profile/me" onClick={closeSidebar}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 hover:bg-[var(--color-sidebar-accent)] transition-colors">
              <span className={["grid h-8 w-8 shrink-0 place-items-center rounded-full",
                "bg-[var(--color-accent)] text-xs font-bold text-white",
                "shadow-[0_2px_8px_var(--color-accent-glow)] ring-2 ring-[var(--color-accent)]/20"].join(" ")}>
                {avatarLetter}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[var(--color-sidebar-text-active)]">{userEmail}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">Ver perfil</p>
              </div>
            </Link>
            <button onClick={handleLogout}
              className={["flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 min-h-[44px]",
                "text-[13px] font-medium text-[var(--color-sidebar-text)]",
                "transition-all duration-150 hover:bg-[var(--color-error-soft)] hover:text-[var(--color-error)] active:scale-[0.98]"].join(" ")}>
              {icons.logout} Cerrar sesión
            </button>
          </div>
        )}
      </aside>

      {/* ══════ CONTENIDO PRINCIPAL ══════ */}
      <div className="flex flex-1 flex-col lg:pl-[var(--sidebar-width)]">

        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <header className={["sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3",
          "border-b border-[var(--color-border)] bg-[var(--color-topbar)] px-4 backdrop-blur-xl sm:px-5"].join(" ")}>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button type="button" onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={sidebarOpen}
              className={["grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
                "text-[var(--color-muted)] transition-all duration-150",
                "hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)] active:scale-95 lg:hidden"].join(" ")}>
              <span className="transition-transform duration-200" style={{ transform: sidebarOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                {sidebarOpen ? icons.close : icons.menu}
              </span>
            </button>

            {/* ── GlobalSearch (buscador real con autocomplete) ── */}
            <div className="hidden sm:block flex-1 max-w-[340px]">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {!token && (
              <div className="flex items-center gap-2">
                <Link href="/login" className="rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] sm:px-4">
                  Entrar
                </Link>
                <Link href="/register" className={["rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-2 text-[13px] font-semibold text-white",
                  "shadow-[0_2px_10px_var(--color-accent-glow)] transition-all duration-150",
                  "hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 sm:px-4"].join(" ")}>
                  Registro
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-9 safe-bottom">
          {children}
        </main>
      </div>
    </div>
  );
}
