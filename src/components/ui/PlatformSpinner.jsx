// components/ui/PlatformSpinner.jsx
// Spinner de carga centrado con icono y color de la plataforma.
// Se muestra mientras profiles === undefined (carga inicial).

"use client";

import PlatformIcon from "@/components/ui/PlatformIcon";
import { PLATFORM_META } from "@/components/ui/PlatformPage";

export default function PlatformSpinner({ platform }) {
  const meta  = PLATFORM_META[platform];
  const color = meta?.color || "var(--color-accent)";
  const label = meta?.label || platform;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="relative h-14 w-14">
        {/* Anillo base */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[var(--color-border)]" />
        {/* Anillo giratorio con color de la plataforma */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: color,
            animation: "spin 0.9s linear infinite",
          }}
        />
        {/* Icono centrado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <PlatformIcon platform={platform} size={22} color={color} />
        </div>
      </div>
      <p className="text-sm font-medium text-[var(--color-muted)] animate-pulse">
        Cargando métricas de {label}…
      </p>
    </div>
  );
}
