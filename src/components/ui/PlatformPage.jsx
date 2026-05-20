"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Cuántas filas mostrar por página en la tabla de historial ────────────────
const PAGE_SIZE = 8;

// ─────────────────────────────────────────────────────────────────────────────
//  PlatformPage — componente genérico que renderizan las 4 páginas de plataforma.
//
//  Props:
//    platform   : "instagram" | "youtube" | "tiktok" | "twitch"
//    profile    : objeto de perfil del usuario o null si no tiene perfil.
//    history    : array de registros aplanados del GET /api/metrics/:profileId
//    period     : "week" | "month" | "year" — filtro de período
//    onPeriod   : setter del período
//    loading    : boolean — mientras carga el historial
//    chartFields: array de { key, label, color } — qué campos graficar
//    growthField: string — campo usado para el badge de crecimiento
// ─────────────────────────────────────────────────────────────────────────────

// ── Colores por plataforma ────────────────────────────────────────────────────
export const PLATFORM_META = {
  instagram: { label: "Instagram", color: "var(--color-instagram)", gradient: "#e1306c,#f77737" },
  youtube:   { label: "YouTube",   color: "var(--color-youtube)",   gradient: "#ff0000,#ff6b6b" },
  tiktok:    { label: "TikTok",    color: "var(--color-tiktok)",    gradient: "#00f2ea,#ff0050" },
  twitch:    { label: "Twitch",    color: "var(--color-twitch)",    gradient: "#9146ff,#bf94ff" },
};

// ── Filtro de período ─────────────────────────────────────────────────────────
function filterByPeriod(history, period) {
  if (!history?.length) return [];
  const now  = new Date();
  const from = new Date();
  if (period === "week")  from.setDate(now.getDate() - 7);
  if (period === "month") from.setMonth(now.getMonth() - 1);
  if (period === "year")  from.setFullYear(now.getFullYear() - 1);
  return history.filter((r) => new Date(r.weekDate) >= from);
}

// ── Animación de número que cuenta desde 0 ───────────────────────────────────
function AnimatedNumber({ value, decimals = 0, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const target   = Number(value) || 0;
    const duration = 900;
    const start    = performance.now();
    const from     = 0;

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out-cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const formatted = display.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span>{formatted}{suffix}</span>;
}

// ── Gráfico de línea SVG animado ─────────────────────────────────────────────
function LineChart({ data, field, color, label }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    setProgress(0);
    const start    = performance.now();
    const duration = 1000;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(1 - Math.pow(1 - p, 3)); // ease-out-cubic
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [data, field]);

  if (!data.length) return null;

  const values = data.map((r) => Number(r[field]) || 0).reverse(); // cronológico
  const W = 400, H = 120, pad = 12;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y];
  });

  // Recortamos los puntos según el progreso de la animación
  const visibleCount = Math.max(2, Math.round(pts.length * progress));
  const visible = pts.slice(0, visibleCount);

  const polyline = visible.map((p) => p.join(",")).join(" ");
  const area     = `M${visible[0]?.[0]},${H} ` +
    visible.map((p) => `L${p[0]},${p[1]}`).join(" ") +
    ` L${visible[visible.length - 1]?.[0]},${H} Z`;

  const id = `grad-${field}`;

  return (
    <div className="w-full">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        {label}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Área bajo la curva */}
        {visible.length > 1 && (
          <path d={area} fill={`url(#${id})`} />
        )}
        {/* Línea */}
        {visible.length > 1 && (
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Punto final */}
        {visible.length > 0 && (
          <circle
            cx={visible[visible.length - 1][0]}
            cy={visible[visible.length - 1][1]}
            r="4"
            fill={color}
            stroke="var(--color-surface-strong)"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}

// ── Badge de crecimiento ──────────────────────────────────────────────────────
function GrowthBadge({ value }) {
  if (value === null || value === undefined) {
    return (
      <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
        Primera semana
      </span>
    );
  }
  const num      = parseFloat(value);
  const positive = num >= 0;
  return (
    <span className={[
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
      positive
        ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
        : "bg-[var(--color-error-soft)] text-[var(--color-error)]",
    ].join(" ")}>
      {positive ? "▲" : "▼"} {Math.abs(num).toFixed(2)} %
    </span>
  );
}

// ── Encabezado de columna ordenable ─────────────────────────────────────────
// Muestra la etiqueta y una flecha que indica la dirección activa.
// Al pulsar, llama a onSort con la clave de columna.
function SortTh({ label, colKey, sortKey, sortDir, onSort }) {
  const isActive = colKey === sortKey;
  return (
    <th
      className="pb-3 pr-4 last:pr-0"
      style={{ whiteSpace: "nowrap" }}
    >
      {/* Botón invisible que cubre toda la celda para detectar el clic */}
      <button
        onClick={() => onSort(colKey)}
        className={[
          "flex items-center gap-1 transition-colors duration-150",
          isActive
            ? "text-[var(--color-accent)]"  // columna activa en color acento
            : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
        ].join(" ")}
      >
        {label}
        {/* Flechas: muestra la activa sólida, la inactiva tenue */}
        <span className="flex flex-col leading-none" style={{ fontSize: 8 }}>
          <span style={{ opacity: isActive && sortDir === "asc"  ? 1 : 0.25 }}>▲</span>
          <span style={{ opacity: isActive && sortDir === "desc" ? 1 : 0.25 }}>▼</span>
        </span>
      </button>
    </th>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PlatformPage({
  platform,
  profile,
  history,
  period,
  onPeriod,
  loading,
  chartFields,
  growthField,
}) {
  const meta      = PLATFORM_META[platform];
  const filtered  = filterByPeriod(history, period);
  const latest    = filtered[0] || null; // más reciente
  const [visible, setVisible] = useState(false);

  // ── Estado de ordenación de la tabla ─────────────────────────────────────
  // sortKey: columna activa | sortDir: "desc" = mayor→menor, "asc" = menor→mayor
  const [sortKey, setSortKey] = useState("weekDate");
  const [sortDir, setSortDir] = useState("desc");

  // ── Estado de paginación ──────────────────────────────────────────────────
  // Vuelve a la página 1 si cambia el período o la ordenación.
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [period, sortKey, sortDir]);

  // Aparece todo con un pequeño delay tras montar
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Datos ordenados y paginados ───────────────────────────────────────────
  // Primero ordenamos el array filtrado por la columna activa.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Los valores nulos (p. ej. growth de la primera semana) van siempre al final.
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;

      // Comparación de fechas como strings ISO (YYYY-MM-DD) es léxicamente correcta.
      const cmp = typeof av === "string"
        ? av.localeCompare(bv)
        : Number(av) - Number(bv);

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Calculamos el número total de páginas y la porción visible.
  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Manejador del clic en cabecera de columna ─────────────────────────────
  // Si se pulsa la misma columna invierte la dirección; si es otra, resetea a desc.
  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // ── Sin perfil creado ─────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div
          className="grid h-20 w-20 place-items-center rounded-[var(--radius-xl)] text-4xl"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}
        >
          {platform === "instagram" && "📸"}
          {platform === "youtube"   && "🎬"}
          {platform === "tiktok"    && "🎵"}
          {platform === "twitch"    && "🎮"}
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">
          Aún no tienes un perfil de {meta.label}
        </h2>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">
          Ve al Dashboard y añade tu perfil de {meta.label} para empezar a registrar estadísticas.
        </p>
        <a
          href="/dashboard"
          className="mt-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: meta.color }}
        >
          Ir al Dashboard
        </a>
      </div>
    );
  }

  // ── Sin datos en el período ───────────────────────────────────────────────
  const noData = !loading && filtered.length === 0;

  return (
    <div
      className="grid gap-6"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "none" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* ── Cabecera ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold"
            style={{ color: meta.color }}
          >
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            @{profile.username} · Estadísticas y crecimiento semanal
          </p>
        </div>

        {/* Selector de período */}
        <div className="flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => onPeriod(p)}
              className={[
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                period === p
                  ? "text-white shadow-sm"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
              ].join(" ")}
              style={period === p ? { background: meta.color } : {}}
            >
              {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards del último registro ─────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : latest ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {chartFields.map(({ key, label }, idx) => (
            <div
              key={key}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 backdrop-blur-xl"
              style={{
                opacity:         visible ? 1 : 0,
                transform:       visible ? "none" : "translateY(16px)",
                transition:      `opacity 0.4s ease ${idx * 80}ms, transform 0.4s ease ${idx * 80}ms`,
                borderTop:       `3px solid ${meta.color}`,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                <AnimatedNumber value={latest[key] ?? 0} />
              </p>
              {/* Growth solo en el campo de crecimiento */}
              {key === growthField && (
                <div className="mt-2">
                  <GrowthBadge value={latest.growth} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Gráficos de línea ───────────────────────────────────────────── */}
      {!loading && !noData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-6 text-base font-semibold text-[var(--color-text)]">
            Evolución en el período
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {chartFields.map(({ key, label }, idx) => (
              <div
                key={key}
                style={{
                  opacity:    visible ? 1 : 0,
                  transform:  visible ? "none" : "translateY(10px)",
                  transition: `opacity 0.5s ease ${200 + idx * 100}ms, transform 0.5s ease ${200 + idx * 100}ms`,
                }}
              >
                <LineChart
                  data={filtered}
                  field={key}
                  color={meta.color}
                  label={label}
                />
              </div>
            ))}

            {/* Gráfico de engagement */}
            <div
              style={{
                opacity:    visible ? 1 : 0,
                transition: `opacity 0.5s ease ${200 + chartFields.length * 100}ms`,
              }}
            >
              <LineChart
                data={filtered}
                field="engagement"
                color="var(--color-secondary)"
                label="Engagement (%)"
              />
            </div>

            {/* Gráfico de growth */}
            <div
              style={{
                opacity:    visible ? 1 : 0,
                transition: `opacity 0.5s ease ${300 + chartFields.length * 100}ms`,
              }}
            >
              <LineChart
                data={filtered.filter((r) => r.growth !== null && r.growth !== undefined)}
                field="growth"
                color="var(--color-success)"
                label="Crecimiento semanal (%)"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de historial ──────────────────────────────────────────── */}
      {!loading && !noData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">

          {/* Cabecera de la sección con contador de registros */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Historial de registros
            </h2>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              {sorted.length} {sorted.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Cada encabezado es pulsable para ordenar por esa columna.
                    La flecha indica la columna activa y la dirección actual. */}
                <tr className="border-b border-[var(--color-border)] text-left text-[11px] uppercase tracking-widest text-[var(--color-muted)]">

                  {/* Columna Semana: siempre la primera, ordena por weekDate */}
                  <SortTh
                    label="Semana"
                    colKey="weekDate"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />

                  {/* Columnas dinámicas de la plataforma (views, likes, etc.) */}
                  {chartFields.map(({ key, label }) => (
                    <SortTh
                      key={key}
                      label={label}
                      colKey={key}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  ))}

                  {/* Engagement: también ordenable */}
                  <SortTh
                    label="Engagement"
                    colKey="engagement"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />

                  {/* Crecimiento: también ordenable */}
                  <SortTh
                    label="Crecimiento"
                    colKey="growth"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {/* Iteramos solo sobre la página actual de datos */}
                {paginated.map((row, idx) => {
                  // ── Color de fila según crecimiento ──────────────────
                  // Verde muy suave si growth > 0, rojo si < 0, neutro si null.
                  const g = row.growth !== null && row.growth !== undefined
                    ? parseFloat(row.growth)
                    : null;
                  const rowBg = g === null
                    ? undefined
                    : g >= 0
                      ? "rgba(34,197,94,0.06)"   // verde suave
                      : "rgba(239,68,68,0.06)";  // rojo suave

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[var(--color-surface-strong)]/40"
                      style={{
                        opacity:    visible ? 1 : 0,
                        transform:  visible ? "none" : "translateX(-8px)",
                        // Escalona la animación de entrada por índice de fila
                        transition: `opacity 0.3s ease ${idx * 40}ms, transform 0.3s ease ${idx * 40}ms`,
                        // Fondo de color según crecimiento de esa semana
                        background: rowBg,
                      }}
                    >
                      {/* Fecha de la semana */}
                      <td className="py-3 pr-4 font-medium text-[var(--color-text)]">
                        {new Date(row.weekDate).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>

                      {/* Campos numéricos de la plataforma */}
                      {chartFields.map(({ key }) => (
                        <td key={key} className="py-3 pr-4 text-[var(--color-text)]">
                          {row[key] !== null && row[key] !== undefined
                            ? Number(row[key]).toLocaleString("es-ES")
                            : "—"}
                        </td>
                      ))}

                      {/* Badge de engagement (azul/morado) */}
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-[var(--color-secondary-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-secondary)]">
                          {parseFloat(row.engagement ?? 0).toFixed(2)} %
                        </span>
                      </td>

                      {/* Badge de crecimiento (verde/rojo/gris) */}
                      <td className="py-3">
                        <GrowthBadge value={row.growth} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Controles de paginación ──────────────────────────────── */}
          {/* Solo se muestran si hay más de una página */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              {/* Indicador de página actual */}
              <span className="text-xs text-[var(--color-muted)]">
                Página {page} de {totalPages}
              </span>

              <div className="flex gap-2">
                {/* Botón Anterior */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={[
                    "rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                    page === 1
                      ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40"
                      : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  ].join(" ")}
                >
                  ← Anterior
                </button>

                {/* Numeración de páginas: muestra máx. 5 botones centrados en la actual */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages ||
                    (n >= page - 1 && n <= page + 1))
                  .reduce((acc, n, i, arr) => {
                    // Inserta "…" si hay un salto entre páginas consecutivas
                    if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-[var(--color-muted)]">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={[
                          "min-w-[28px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-semibold transition-all duration-150",
                          page === item
                            ? "border-[var(--color-accent)] text-white"
                            : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                        ].join(" ")}
                        style={page === item ? { background: meta.color } : {}}
                      >
                        {item}
                      </button>
                    )
                  )}

                {/* Botón Siguiente */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={[
                    "rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                    page === totalPages
                      ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-40"
                      : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  ].join(" ")}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {noData && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            No hay datos para el período seleccionado.
          </p>
          <a href="/dashboard/metrics" className="mt-3 inline-block text-sm font-semibold" style={{ color: meta.color }}>
            Añadir estadísticas →
          </a>
        </div>
      )}
    </div>
  );
}
