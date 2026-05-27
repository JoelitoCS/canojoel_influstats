"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

/* ── ICONOS ─────────────────────────────────────────────── */
const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  grid: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  rankings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /></svg>,
  explore: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="8" /></svg>,
  compare: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 3H5a2 2 0 0 0-2 2v4" /></svg>,
  instagram: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="2" width="20" height="20" /></svg>,
  tiktok: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 12a4 4 0 1 0 4 4V4" /></svg>,
  twitch: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 2H3v16h5v4l4-4h5l4-4V2z" /></svg>,
  youtube: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M22 6 12 12 22 18z" /></svg>,
  menu: <svg width="22" height="22"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  close: <svg width="22" height="22"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  logout: <svg width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5" /></svg>,
  search: <svg width="16" height="16"><circle cx="11" cy="11" r="8" /></svg>,
};

/* ── NAV ─────────────────────────────────────────────── */
const navSections = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/dashboard/rankings", label: "Ranking", icon: "trophy" },
      { href: "/dashboard/metrics", label: "Estadísticas", icon: "rankings" },
      { href: "/dashboard/compare", label: "Comparativa", icon: "compare" },
      { href: "/dashboard/comparar", label: "VS Perfiles", icon: "compare" },
      { href: "/dashboard/explore", label: "Explorar", icon: "explore" },
    ],
  },
  {
    title: "Plataformas",
    items: [
      { href: "/dashboard/plataformas", label: "Todas", icon: "grid" },
      { href: "/dashboard/instagram", label: "Instagram", icon: "instagram" },
      { href: "/dashboard/tiktok", label: "TikTok", icon: "tiktok" },
      { href: "/dashboard/twitch", label: "Twitch", icon: "twitch" },
      { href: "/dashboard/youtube", label: "YouTube", icon: "youtube" },
    ],
  },
];

/* ── STORAGE ─────────────────────────────────────────────── */
const subscribeStorage = (cb) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const getToken = () => localStorage.getItem("token");
const getEmail = () => localStorage.getItem("userEmail") || "Mi cuenta";
const getRole = () => localStorage.getItem("userRole") || "user";

/* ── NAV ITEM ─────────────────────────────────────────────── */
function NavItem({ item, isActive, onClick }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2.5",
        isActive
          ? "bg-[var(--color-sidebar-accent)] text-white"
          : "text-gray-400 hover:text-white",
      ].join(" ")}
    >
      {icons[item.icon]}
      {item.label}
    </Link>
  );
}

/* ─────────────────────────────────────────────── */
export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const token = useSyncExternalStore(subscribeStorage, getToken, () => null);
  const userEmail = useSyncExternalStore(subscribeStorage, getEmail, () => "Mi cuenta");
  const userRole = useSyncExternalStore(subscribeStorage, getRole, () => "user");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ✅ FIX PRINCIPAL: solo pathname */
  const isItemActive = (href) => href === pathname;

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <aside className={[
        "fixed left-0 top-0 h-full w-64 bg-black text-white transition-transform",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      ].join(" ")}>

        <div className="p-4 font-bold">InfluStats</div>

        <nav className="p-3 space-y-6">
          {navSections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="text-xs text-gray-500 mb-2">{section.title}</p>
              )}

              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={isItemActive(item.href)}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          ))}

          {userRole === "admin" && (
            <NavItem
              item={{ href: "/dashboard/admin", label: "Admin", icon: "dashboard" }}
              isActive={isItemActive("/dashboard/admin")}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </nav>

        {token && (
          <button onClick={handleLogout} className="p-4 text-red-400">
            Logout
          </button>
        )}
      </aside>

      {/* CONTENT */}
      <main className="flex-1 lg:ml-64 p-6">
        {children}
      </main>

      {/* MOBILE BUTTON */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 lg:hidden bg-black text-white p-3 rounded-full"
      >
        {sidebarOpen ? icons.close : icons.menu}
      </button>
    </div>
  );
}