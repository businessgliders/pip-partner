import { useEffect } from "react";

/**
 * Apply native-web-app behaviors to the page while mounted, then cleanly
 * restore them on unmount so the rest of the app (public marketing pages,
 * settings, login, etc.) keeps normal browser behavior.
 *
 * Measures applied:
 *  1. Prevent pinch-zoom (sets maximum-scale=1, user-scalable=no on viewport).
 *  2. Prevent iOS Safari auto-zoom when focusing an input < 16px.
 *  3. Prevent body rubber-band overscroll (drag-bounce on iOS/macOS).
 *  4. Prevent double-tap-to-zoom on tappable UI (touch-action: manipulation).
 *  5. Disable iOS callout / text-selection on non-text UI elements
 *     (buttons, pills, cards) so long-press feels app-native.
 *
 * Mount this once at the top of a page that should behave like a native app.
 */
export default function WebAppMeasures() {
  useEffect(() => {
    // ─── 1. Viewport: disable pinch-zoom ──────────────────────────────────
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewportContent = viewport?.getAttribute("content") || null;
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      );
    }

    // ─── 2-5. Inject scoped CSS ───────────────────────────────────────────
    const style = document.createElement("style");
    style.setAttribute("data-webapp-measures", "");
    style.textContent = `
      /* Prevent body/html overscroll (rubber-banding) and document scroll —
         the ApplicationBoard manages its own scrollable regions. */
      html, body {
        overscroll-behavior: none;
        overflow: hidden;
        -webkit-overflow-scrolling: touch;
      }

      /* Snappy taps — disable 300ms double-tap-to-zoom delay on tappable UI. */
      button, a, [role="button"], [data-tap] {
        touch-action: manipulation;
      }

      /* Disable iOS long-press callout & text selection on chrome elements.
         Real content (composer, message bodies, search input) opts back in
         via .selectable below. */
      button, [role="button"], .no-select {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      /* Inputs, textareas, contenteditable & message text must allow
         selection / standard interaction. */
      input, textarea, [contenteditable="true"], .ql-editor, .selectable {
        -webkit-user-select: text;
        user-select: text;
      }

      /* iOS auto-zoom guard: any form control with computed font-size < 16px
         triggers a focus-zoom on iPhone Safari. Force 16px on touch devices. */
      @media (hover: none) and (pointer: coarse) {
        input, textarea, select {
          font-size: 16px !important;
        }
      }

      /* Inner scroll regions still need their own bouncy momentum, but the
         bounce must not propagate up to the page. */
      .overflow-y-auto, .overflow-auto, .overflow-x-auto {
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (viewport && previousViewportContent !== null) {
        viewport.setAttribute("content", previousViewportContent);
      }
      style.remove();
    };
  }, []);

  return null;
}