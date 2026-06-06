import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import useHorizontalScroll from "@/hooks/useHorizontalScroll";

/**
 * MasterSwimlaneScroller — extracted from pip-partner's SwimlaneScroller pattern.
 *
 * A lightweight horizontal scroller for "swimlanes" (rows of related cards
 * inside a single column, e.g. an escalation row). Provides the same gold-
 * standard arrow tracking as the main board, but for inline rows.
 *
 * Use this when a single column needs its own horizontal mini-scroller
 * (e.g. for grouped category chips, escalation steps, or status timelines).
 *
 * Children: any horizontal flex row. The hook measures the FIRST child for
 * scroll-step sizing — pass `itemSelector` to override.
 */
export default function MasterSwimlaneScroller({
  children,
  className,
  itemSelector,
  arrowSize = "sm",
}) {
  const { ref, canScrollLeft, canScrollRight, scrollBy } = useHorizontalScroll(
    itemSelector ? { itemSelector } : undefined
  );

  const arrowDim = arrowSize === "lg" ? "w-9 h-9" : "w-7 h-7";
  const iconDim = arrowSize === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <div className={cn("relative group", className)}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 shadow-md border border-slate-200 flex items-center justify-center hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity",
            arrowDim
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className={cn("text-slate-700", iconDim)} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 shadow-md border border-slate-200 flex items-center justify-center hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity",
            arrowDim
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className={cn("text-slate-700", iconDim)} />
        </button>
      )}
      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
    </div>
  );
}