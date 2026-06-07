import { useEffect, useRef } from 'react';

/**
 * iOS-style drag lift wrapper.
 *
 * Wraps a card so that when @hello-pangea/dnd reports `isDragging`:
 *   - the inner content "pops" with a subtle scale + tilt (springy ease)
 *   - the device emits a short haptic (Android / supporting browsers)
 *
 * IMPORTANT: this transform lives on an INNER element. The outer element
 * keeps the drag library's own translate(x,y) transform untouched — never
 * combine the two on the same node or you'll break drop positioning.
 */
export default function DragLiftWrapper({ isDragging, children }) {
  const wasDragging = useRef(false);

  useEffect(() => {
    if (isDragging && !wasDragging.current) {
      // Short pickup haptic — feels like an iOS long-press lift
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(12); } catch { /* ignore */ }
      }
    }
    wasDragging.current = isDragging;
  }, [isDragging]);

  return (
    <div
      style={{
        transform: isDragging ? 'scale(1.04) rotate(1.5deg)' : 'none',
        transition: 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformOrigin: 'center',
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {children}
    </div>
  );
}