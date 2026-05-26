"use client";

// Toggle claro/oscuro con transición spring en el knob.
export default function ThemeToggle() {
  const handleToggle = () => {
    const currentTheme = document.documentElement.dataset.theme || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      type="button"
      className={[
        "theme-toggle group relative inline-flex h-9 w-[60px] items-center",
        "rounded-full border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-1",
        "transition-all duration-150",
        "hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1",
        "active:scale-95",
      ].join(" ")}
      onClick={handleToggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      <span className={[
        "theme-knob relative grid h-7 w-7 place-items-center rounded-full",
        "bg-[var(--color-accent)] text-xs font-bold text-white",
        "shadow-[0_2px_8px_var(--color-accent-glow)]",
        "group-active:scale-90",
      ].join(" ")} />
    </button>
  );
}
