"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

// Navegacion principal compartida por las pantallas privadas y publicas.
const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Dashboard" },
];

// Suscripcion al storage para que el header cambie al iniciar o cerrar sesion.
const subscribeToStorage = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

// Lee el token actual en cliente para decidir si mostrar auth o perfil.
const getTokenSnapshot = () => localStorage.getItem("token");

// Lee el email guardado tras login/registro para mostrar contexto en el menu.
const getEmailSnapshot = () => localStorage.getItem("userEmail") || "Mi cuenta";

// Snapshot seguro para render inicial en servidor.
const getServerTokenSnapshot = () => null;

// Calcula la inicial del usuario cuando aun no existe foto de perfil.
const getAvatarLetter = (email) => {
  const firstCharacter = String(email || "U").trim().charAt(0);
  return firstCharacter ? firstCharacter.toUpperCase() : "U";
};

// Layout base del frontend: cabecera, navegacion y contenedor responsive.
export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useSyncExternalStore(subscribeToStorage, getTokenSnapshot, getServerTokenSnapshot);
  const userEmail = useSyncExternalStore(subscribeToStorage, getEmailSnapshot, () => "Mi cuenta");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const avatarLetter = getAvatarLetter(userEmail);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsMenuOpen(false);
    window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
    window.dispatchEvent(new StorageEvent("storage", { key: "userEmail", newValue: null }));
    router.push("/login");
  };

  return (
    <div className="min-h-screen text-[var(--color-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-sm font-black text-[#071018] shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              IS
            </span>
            <span className="font-[var(--font-display)] text-2xl text-[var(--color-text)]">InfluStats</span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm font-medium text-[var(--color-muted)] sm:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-[var(--radius-md)] px-4 py-2 transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text)] shadow-[var(--shadow-glow)]"
                      : "hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {token ? (
              <div className="relative">
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 pr-3 text-sm font-semibold text-[var(--color-text)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]"
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-black text-[#071018] shadow-[var(--shadow-glow)]">
                    {avatarLetter}
                  </span>
                  <span className="hidden sm:inline">Mi perfil</span>
                </button>

                {isMenuOpen && (
                  <div className="animate-scale-in absolute right-0 top-12 z-20 w-64 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-strong)]/95 p-2 shadow-[var(--shadow-card)] backdrop-blur-xl">
                    <div className="mb-1 flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] p-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-accent)] text-sm font-black text-[#071018]">
                        {avatarLetter}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                          Cuenta
                        </p>
                        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{userEmail}</p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Ver dashboard
                    </Link>
                    <button
                      type="button"
                      className="block w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm text-[var(--color-error)] transition-colors hover:bg-[var(--color-accent-soft)]"
                      onClick={handleLogout}
                    >
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Registro</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
