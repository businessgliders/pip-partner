import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useHorizontalScroll — the "gold standard" scroll tracker extracted from
 * pip-support/TicketBoard.jsx. Tracks whether a scroll container can scroll
 * left/right and provides a smooth scroll-by-column helper.
 *
 * Usage:
 *   const { ref, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll();
 *   <div ref={ref} className="overflow-x-auto">...</div>
 *   <button onClick={() => scrollBy('left')} disabled={!canScrollLeft}>‹</button>
 *
 * @param {object} options
 * @param {string} [options.itemSelector='[data-kanban-column]'] - selector used to
 *        measure step size when scrolling by one column.
 */
export default function useHorizontalScroll({ itemSelector = "[data-kanban-column]" } = {}) {
  const ref = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = useCallback((direction) => {
    const el = ref.current;
    if (!el) return;
    const firstChild = el.querySelector(itemSelector);
    const step = firstChild
      ? firstChild.getBoundingClientRect().width + 16
      : el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
    setTimeout(update, 400);
  }, [itemSelector, update]);

  return { ref, canScrollLeft, canScrollRight, scrollBy, refresh: update };
}