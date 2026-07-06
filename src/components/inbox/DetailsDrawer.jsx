import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * DetailsDrawer — a right-anchored, full-height slide-in overlay used to show
 * the ticket details panel on viewports where there isn't room for a
 * persistent side column. Consistent across mobile / tablet / desktop-narrow
 * — same visual pattern, same close affordance.
 *
 * Props:
 *   open       — controls visibility
 *   onClose    — called when the user closes the drawer
 *   title      — string shown in the header (e.g. the applicant's name)
 *   children   — details panel content
 */
export default function DetailsDrawer({ open, onClose, title, children }) {
  // Close on ESC for keyboard parity with dialogs.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  // Portal to document.body so `position: fixed` is scoped to the viewport
  // rather than a transformed ancestor (framer-motion / pip-view-in leave a
  // lingering transform which would otherwise scope fixed positioning to it).
  return createPortal(
    <>
      {/* Backdrop — dims the underlying content so focus is on the details.
          On mobile (< sm) it starts right below the top page header so the
          drawer covers the ticket card + email panel; on sm+ it covers the
          full viewport. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 bg-black/40 backdrop-blur-sm sm:top-0 pip-fade-in"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 112px)" }}
        onClick={onClose}
      />

      {/* Panel — slides in from the right. On mobile it covers everything
          below the top page header (ticket card + email panel included). On
          sm+ it's full-height and capped to a side-panel width. */}
      <div
        className="fixed right-0 bottom-0 z-50 w-full sm:top-0 sm:h-[100dvh] sm:max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col rounded-t-xl sm:rounded-none overflow-hidden border border-gray-200 sm:border-0 pip-slide-in-right"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 112px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
              Details
            </div>
            {title && (
              <div className="text-sm font-semibold text-slate-800 truncate">{title}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close details"
            className="shrink-0 p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
      </div>
    </>,
    document.body
  );
}