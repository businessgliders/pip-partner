import React, { useEffect, useRef } from "react";
import { GripHorizontal } from "lucide-react";

/**
 * Thin top-edge bar that lets the user drag UP/DOWN to resize the composer
 * editor. `onResize` receives the new editor height in px (clamped by the
 * parent if needed).
 */
export default function ComposerDragHandle({ currentHeight, onResize, minHeight = 80, maxHeight = 600 }) {
  const startY = useRef(0);
  const startHeight = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const clientY = e.touches?.[0]?.clientY ?? e.clientY;
      const delta = startY.current - clientY; // drag up = grow
      const next = Math.max(minHeight, Math.min(maxHeight, startHeight.current + delta));
      onResize(next);
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onResize, minHeight, maxHeight]);

  const onDown = (e) => {
    dragging.current = true;
    startY.current = e.touches?.[0]?.clientY ?? e.clientY;
    startHeight.current = currentHeight;
    document.body.style.userSelect = "none";
  };

  return (
    <div
      onMouseDown={onDown}
      onTouchStart={onDown}
      className="group flex items-center justify-center h-3 cursor-row-resize bg-gray-50 hover:bg-pink-50 border-t border-b border-gray-200 select-none"
      title="Drag to resize"
    >
      <GripHorizontal className="w-4 h-4 text-gray-400 group-hover:text-pink-500" />
    </div>
  );
}