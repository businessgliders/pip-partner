import { useEffect, useRef } from "react";

/**
 * Calls onVisible() once when the wrapped element has been at least 50% visible
 * in the viewport for `dwellMs` ms.
 *
 * Renders its children inside a div so we can observe it.
 */
export default function UnreadMessageMarker({ enabled, onVisible, dwellMs = 1000, children }) {
  const ref = useRef(null);
  const firedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (firedRef.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                firedRef.current = true;
                onVisible?.();
                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = null;
                }
              }, dwellMs);
            }
          } else {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        }
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, onVisible, dwellMs]);

  return <div ref={ref}>{children}</div>;
}