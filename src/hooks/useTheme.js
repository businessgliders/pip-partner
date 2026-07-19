import { useEffect, useState } from "react";

const KEY = "pip_theme"; // "light" | "dark" | "auto"
const EVT = "pip-theme-change";

const isNight = () => {
  const h = new Date().getHours();
  return h >= 20 || h < 7; // approx: after sunset until morning
};

export const resolveDark = (mode) =>
  mode === "dark" ? true : mode === "light" ? false : isNight();

// Theme mode hook. Pass applyToDocument=true from ONE always-mounted shell
// component — it toggles the `dark` class on <html> (re-checked each minute
// so "auto" flips at sunset) and removes it on unmount.
export default function useTheme(applyToDocument = false) {
  const [mode, setModeState] = useState(() => {
    try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; }
  });

  const setMode = (m) => {
    try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
  };

  useEffect(() => {
    const sync = () => {
      try { setModeState(localStorage.getItem(KEY) || "auto"); } catch { /* ignore */ }
    };
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  useEffect(() => {
    if (!applyToDocument) return;
    const apply = () => document.documentElement.classList.toggle("dark", resolveDark(mode));
    apply();
    const t = setInterval(apply, 60000);
    return () => {
      clearInterval(t);
      document.documentElement.classList.remove("dark");
    };
  }, [mode, applyToDocument]);

  return { mode, setMode, dark: resolveDark(mode) };
}