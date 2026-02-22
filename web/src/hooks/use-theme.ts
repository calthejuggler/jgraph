import { useCallback, useSyncExternalStore } from "react";

function getSnapshot(): "light" | "dark" {
  return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Apply theme on read
  applyTheme(theme);

  const toggleTheme = useCallback(() => {
    const next = getSnapshot() === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  return { theme, toggleTheme } as const;
}
