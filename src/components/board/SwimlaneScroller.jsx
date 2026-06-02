import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * iOS-style horizontal swimlane scroller for mobile/tablet.
 * - Snaps to each lane (one column per snap point).
 * - Auto-hiding left/right chevrons.
 * - Hidden entirely on desktop (lg:contents) so the parent grid layout takes over.
 *
 * Children should be plain column elements; this component wraps each one
 * in a `data-swimlane` lane for snap + step calculation.
 */
export default function SwimlaneScroller({ children, className = "" }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  // Re-check after the children set changes (e.g. step/board switch)
  const childCount = React.Children.count(children);
  useEffect(() => {
    const t = setTimeout(updateScrollButtons, 50);
    return () => clearTimeout(t);
  }, [updateScrollButtons, childCount]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const firstChild = el.querySelector("[data-swimlane]");
    const step = firstChild
      ? firstChild.getBoundingClientRect().width + 16 // gap-4
      : el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
    setTimeout(updateScrollButtons, 400);
  };

  return (
    <div className="relative lg:contents">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Previous column"
          className="lg:hidden absolute left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full backdrop-blur-md bg-white/70 hover:bg-white/90 border border-white/80 shadow-lg flex items-center justify-center text-gray-800 active:scale-95 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Next column"
          className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full backdrop-blur-md bg-white/70 hover:bg-white/90 border border-white/80 shadow-lg flex items-center justify-center text-gray-800 active:scale-95 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth overscroll-x-contain scroll-pl-4 -mx-4 pl-4 pr-4 pb-2 h-full touch-pan-x ${className}`}
      >
        {React.Children.map(children, (child, i) =>
          child ? (
            <div
              key={i}
              data-swimlane
              className="flex-shrink-0 w-[85%] sm:w-[60%] md:w-[45%] snap-start h-full"
            >
              {child}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}