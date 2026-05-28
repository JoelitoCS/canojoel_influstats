"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  src/app/dashboard/explore/page.js — Explorar usuarios
//  - Búsqueda autocomplete en tiempo real
//  - Grid de usuarios recomendados por ranking
//  - Paginación
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useUserSearch } from "@/lib/useUserSearch";
import { exploreUsers } from "@/lib/userProfileApi";

// ── Iconos ───────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ animation: "spin 0.7s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
  </svg>
);

const ChevronIcon = ({ dir = "right" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d={dir === "right" ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}/>
  </svg>
);

// ── Avatar placeholder ─────────────────────────────────────────────────────
function AvatarPlaceholder({ username, size = 44 }) {
  const letter  = (username || "U").charAt(0).toUpperCase();
  const colors  = ["#635bff","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
  const color   = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}20`, border: `2px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 800, color,
    }}>
      {letter}
    </div>
  );
}

function Avatar({ url, username, size = 44 }) {
  if (url) return (
    <img src={url} alt={username}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  return <AvatarPlaceholder username={username} size={size} />;
}

// ── Medalla de ranking ─────────────────────────────────────────────────────
function RankBadge({ rank }) {
  if (!rank) return null;
  const medal = { 1: "🥇", 2: "🥈", 3: "🥉" }[rank];
  const colors = {
    1: { bg: "#FFD70020", border: "#FFD70060", text: "#b8860b" },
    2: { bg: "#C0C0C020", border: "#C0C0C060", text: "#757575" },
    3: { bg: "#CD7F3220", border: "#CD7F3260", text: "#8b5e3c" },
  };
  const c = colors[rank] || { bg: "var(--color-accent-soft)", border: "var(--color-accent)44", text: "var(--color-accent)" };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: "var(--radius-xs)", fontSize: 12, fontWeight: 700,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {medal && <span>{medal}</span>}
      #{rank}
    </div>
  );
}

// ── Tarjeta de usuario recomendado ─────────────────────────────────────────
function UserCard({ user, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--color-surface)", border: `1px solid ${hovered ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)", padding: "20px", cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Acento de color en el top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: hovered ? "var(--color-accent)" : "transparent",
        transition: "background 0.2s",
      }} />

      {/* Rank badge */}
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <RankBadge rank={user.rankPosition} />
      </div>

      {/* Avatar + nombre */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar url={user.avatarUrl} username={user.username} size={52} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.displayName || `@${user.username}`}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>
            @{user.username}
            {user.country && ` · ${user.country}`}
          </p>
        </div>
      </div>

      {/* Bio corta */}
      {user.shortBio && (
        <p style={{
          margin: "0 0 14px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {user.shortBio}
        </p>
      )}

      {/* Métricas */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          flex: 1, background: "var(--color-surface-strong)", borderRadius: "var(--radius-sm)", padding: "8px 10px",
          borderTop: "2px solid var(--color-accent)40",
        }}>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Engagement
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-accent)" }}>
            {user.avgEngagement}%
          </p>
        </div>
        <div style={{
          flex: 1, background: "var(--color-surface-strong)", borderRadius: "var(--radius-sm)", padding: "8px 10px",
          borderTop: "2px solid var(--color-secondary)40",
        }}>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Perfiles
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-secondary)" }}>
            {user.profileCount}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Resultado del buscador ────────────────────────────────────────────────
function SearchResult({ user, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
        cursor: "pointer", borderBottom: "1px solid var(--color-border)",
        background: hovered ? "var(--color-accent-soft)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      <Avatar url={user.avatarUrl} username={user.username} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
          {user.displayName || `@${user.username}`}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>@{user.username}</p>
      </div>
      <span style={{ color: "var(--color-muted)", opacity: hovered ? 1 : 0.5, transition: "opacity 0.1s" }}>
        <ChevronIcon />
      </span>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)", padding: "20px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 15, borderRadius: 6, marginBottom: 6, width: "60%" }} />
          <div className="skeleton" style={{ height: 12, borderRadius: 6, width: "40%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, borderRadius: 6, marginBottom: 10, width: "80%" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton" style={{ flex: 1, height: 52, borderRadius: "var(--radius-sm)" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Página principal
// ═══════════════════════════════════════════════════════════════════════════════
export default function ExplorePage() {
  const router = useRouter();
  const { query, setQuery, results: searchResults, loading: searchLoading } = useUserSearch();
  const [recommended,    setRecommended]    = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [page,           setPage]           = useState(1);
  const [pagination,     setPagination]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setExploreLoading(true);
    exploreUsers(page)
      .then((d) => {
        if (!cancelled) {
          setRecommended(d.results || []);
          setPagination(d.pagination);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setExploreLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const go = (username) => router.push(`/dashboard/profile/${username}`);
  const showSearch = query.length >= 1;

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: "var(--color-text)" }}>
            Explorar usuarios
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--color-muted)" }}>
            Descubre influencers y creadores de contenido
          </p>
        </div>

        {/* ── Barra de búsqueda ──────────────────────────────────────── */}
        <div style={{
          background: "var(--color-surface)", border: `1px solid ${showSearch ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-lg)", marginBottom: 28, overflow: "hidden",
          boxShadow: showSearch ? "0 0 0 3px var(--color-accent-soft)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}>
          {/* Input */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
            borderBottom: showSearch ? "1px solid var(--color-border)" : "none" }}>
            <span style={{ color: searchLoading ? "var(--color-accent)" : "var(--color-muted)", flexShrink: 0 }}>
              {searchLoading ? <SpinnerIcon /> : <SearchIcon />}
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Buscar por username o nombre…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 15, color: "var(--color-text)",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)",
                  padding: 4, borderRadius: 4, display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {showSearch && (
            <div>
              {!searchLoading && searchResults.length === 0 && (
                <div style={{ padding: "16px 20px", color: "var(--color-muted)", fontSize: 14,
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🔍</span>
                  <span>Sin resultados para <strong>&ldquo;{query}&rdquo;</strong></span>
                </div>
              )}
              {searchResults.map((u) => (
                <SearchResult key={u.id} user={u} onClick={() => go(u.username)} />
              ))}
              {searchResults.length > 0 && (
                <div style={{ padding: "8px 16px", background: "var(--color-surface-strong)",
                  borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>
                    {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Usuarios recomendados ───────────────────────────────────── */}
        {!showSearch && (
          <>
            {/* Cabecera sección */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text)",
                display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--color-warning)" }}><TrophyIcon /></span>
                Usuarios recomendados
              </h2>
              {pagination && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
                    {pagination.total} usuarios
                  </span>
                </div>
              )}
            </div>

            {/* Grid */}
            {exploreLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : recommended.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "64px 0",
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
              }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text)" }}>
                  Aún no hay usuarios públicos
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-muted)" }}>
                  ¡Sé el primero en crear tu perfil público!
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
                  {recommended.map((u) => (
                    <UserCard key={u.id} user={u} onClick={() => go(u.username)} />
                  ))}
                </div>

                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "8px 16px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)", background: "var(--color-surface)",
                        color: "var(--color-text)", cursor: page === 1 ? "not-allowed" : "pointer",
                        opacity: page === 1 ? 0.4 : 1, fontSize: 13, fontWeight: 500,
                        transition: "all 0.15s",
                      }}>
                      <ChevronIcon dir="left" /> Anterior
                    </button>

                    {/* Páginas numéricas */}
                    {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => {
                      const p = i + 1;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          style={{
                            width: 36, height: 36, borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
                            border: `1px solid ${page === p ? "var(--color-accent)" : "var(--color-border)"}`,
                            background: page === p ? "var(--color-accent)" : "var(--color-surface)",
                            color: page === p ? "white" : "var(--color-text)",
                            cursor: "pointer", transition: "all 0.15s",
                          }}>
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "8px 16px", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)", background: "var(--color-surface)",
                        color: "var(--color-text)",
                        cursor: page === pagination.pages ? "not-allowed" : "pointer",
                        opacity: page === pagination.pages ? 0.4 : 1, fontSize: 13, fontWeight: 500,
                        transition: "all 0.15s",
                      }}>
                      Siguiente <ChevronIcon />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
