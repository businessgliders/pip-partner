import { useEffect } from "react";

// Blocks background scrolling while a modal/drawer overlay is active.
// Locks both the document body and the app shell's <main> scroll container,
// restoring their previous values on close (nested overlays restore safely).
export default function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    const main = document.querySelector("main");
    const prevBody = document.body.style.overflow;
    const prevMain = main ? main.style.overflow : null;
    document.body.style.overflow = "hidden";
    if (main) main.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      if (main) main.style.overflow = prevMain;
    };
  }, [active]);
}