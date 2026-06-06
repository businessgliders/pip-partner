import { useEffect, useState } from "react";

/**
 * useIsTouchViewport — returns true when the viewport is at or below the
 * given breakpoint (default: tailwind's `lg`, 1024px). Used to disable
 * drag-and-drop on touch devices so vertical card-list scrolling and
 * horizontal lane swipes work without @hello-pangea/dnd hijacking touch
 * events.
 *
 * Borrowed from pip-partner/components/board/KanbanColumn.jsx where it was
 * the fix for a real bug.
 */
export default function useIsTouchViewport(maxWidth = 1023) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [maxWidth]);

  return isTouch;
}