// ─────────────────────────────────────────────────────────────────────────────
//  src/lib/useUserSearch.js — Hook reutilizable para búsqueda de usuarios
//
//  Usado tanto en el header (GlobalSearch) como en la página Explorar.
//  Mismo hook, mismo endpoint, sin lógica duplicada.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchUsers } from "@/lib/userProfileApi";

const DEBOUNCE_MS = 250; // ms de debounce para no spamear la API

export function useUserSearch(initialQuery = "") {
  const [query,   setQuery]   = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const abortRef  = useRef(null);
  const timerRef  = useRef(null);

  const search = useCallback((q) => {
    // Cancelar timer anterior (debounce)
    if (timerRef.current) clearTimeout(timerRef.current);
    // Cancelar petición anterior en vuelo
    if (abortRef.current) abortRef.current.abort();

    if (!q || q.trim().length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await searchUsers(q.trim(), 8);
        setResults(data.results || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Re-buscar cada vez que cambia query
  useEffect(() => {
    search(query);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, search]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}
