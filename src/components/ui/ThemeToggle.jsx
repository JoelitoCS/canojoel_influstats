"use client";

// Toggle claro/oscuro con estética actualizada.
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
      className="theme-toggle group inline-flex h-9 w-16 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 transition-all duration-300 hover:border-[var(--color-accent)]"
      onClick={handleToggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
    >
      <span className="theme-knob grid h-7 w-7 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white shadow-[0_0_12px_var(--color-accent-glow)] transition-transform duration-300 group-active:scale-95" />
    </button>
  );
}
