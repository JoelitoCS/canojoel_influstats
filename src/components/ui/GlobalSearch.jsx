"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  components/ui/GlobalSearch.jsx — Buscador global del header
//  Autocomplete en tiempo real · Debounce 250ms · Dropdown animado
//  Mismo hook que la página Explorar → sin lógica duplicada
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSearch } from "@/lib/useUserSearch";

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ animation: "spin 0.7s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
  </svg>
);

function AvatarPlaceholder({ username, size = 32 }) {
  const letter = (username || "U").charAt(0).toUpperCase();
  const colors  = ["#635bff","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];
  const color   = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}20`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color,
    }}>
      {letter}
    </div>
  );
}

export default function GlobalSearch() {
  const router       = useRouter();
  const inputRef     = useRef(null);
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const { query, setQuery, results, loading } = useUserSearch();

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Teclado global: "/" enfoca el buscador
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = (username) => {
    setOpen(false);
    setFocused(false);
    setQuery("");
    router.push(`/dashboard/profile/${username}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].username);
    }
  };

  const showDropdown = open && query.length >= 1;
  const isActive     = focused || showDropdown;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* ── Input ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: isActive ? "var(--color-surface-hover)" : "var(--color-surface-strong)",
          border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-md)", padding: "7px 12px",
          transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
          boxShadow: isActive ? "0 0 0 3px var(--color-accent-soft)" : "none",
          cursor: "text",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <span style={{ color: loading ? "var(--color-accent)" : "var(--color-muted)", flexShrink: 0, display: "flex" }}>
          {loading ? <SpinnerIcon /> : <SearchIcon />}
        </span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setFocused(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar usuarios…"
          style={{
            background: "transparent", border: "none", outline: "none",
            color: "var(--color-text)", fontSize: 13, width: "100%", minWidth: 0,
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Buscar usuarios en InfluStats"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />

        {/* Atajo de teclado o botón limpiar */}
        {query ? (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: "var(--color-muted)", flexShrink: 0, borderRadius: 4,
              display: "flex", alignItems: "center",
            }}
            aria-label="Limpiar búsqueda">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        ) : (
          <kbd style={{
            fontSize: 11, padding: "1px 5px", borderRadius: 4, flexShrink: 0,
            border: "1px solid var(--color-border)", color: "var(--color-muted)",
            background: "var(--color-surface-strong)", fontFamily: "inherit",
            opacity: isActive ? 0 : 0.6, transition: "opacity 0.15s",
          }}>
            /
          </kbd>
        )}
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
            background: "var(--color-surface-strong)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-card-hover)",
            overflow: "hidden",
            animation: "scale-in 0.15s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {/* Sin resultados */}
          {results.length === 0 && !loading && (
            <div style={{ padding: "14px 16px", color: "var(--color-muted)", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔍</span>
              <span>Sin resultados para <strong>&ldquo;{query}&rdquo;</strong></span>
            </div>
          )}

          {/* Resultados */}
          {results.map((user, idx) => (
            <button
              key={user.id}
              role="option"
              onClick={() => handleSelect(user.username)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 14px",
                background: "none", border: "none", cursor: "pointer",
                textAlign: "left",
                borderBottom: idx < results.length - 1 ? "1px solid var(--color-border)" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-accent-soft)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username}
                  style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <AvatarPlaceholder username={user.username} size={32} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                  @{user.username}
                </p>
                {user.displayName && (
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-muted)" }}>
                    {user.displayName}
                  </p>
                )}
              </div>
              <svg style={{ color: "var(--color-muted)", flexShrink: 0, opacity: 0.5 }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}

          {/* Footer del dropdown: ir a explorar */}
          {results.length > 0 && (
            <button
              onClick={() => { setOpen(false); router.push(`/dashboard/explore`); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                width: "100%", padding: "9px 14px",
                background: "var(--color-surface)", border: "none",
                borderTop: "1px solid var(--color-border)",
                color: "var(--color-accent)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-accent-soft)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--color-surface)"}
            >
              Ver todos los resultados en Explorar →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
