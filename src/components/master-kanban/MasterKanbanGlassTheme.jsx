/**
 * MasterKanbanGlassTheme — drop-in glass theme for a Master Kanban board.
 *
 * Wrap <MasterKanbanBoard className="h-full" /> in:
 *
 *   <div className="board-height-wrap">
 *     <MasterKanbanBoard className="h-full" ... />
 *     <MasterKanbanGlassTheme />
 *   </div>
 *
 * Gives you (from the pip-events spoke bundle):
 *   - Bounded board height → column lists scroll internally
 *   - Glassy translucent columns + cards (backdrop-blur)
 *   - White-on-tint column headers
 *   - All swimlanes fit the viewport on desktop (lg+), scroll on tablet/mobile
 *   - Custom column scrollbars
 *
 * IMPORTANT: card transitions never include `transform` — @hello-pangea/dnd
 * manipulates transform during drag/drop and a CSS transition on it causes a
 * visible "slide-back" flicker after onDragEnd.
 */
export default function MasterKanbanGlassTheme() {
  return (
    <style>{`
      /* ===== Bounded board height — columns scroll internally ===== */
      .board-height-wrap { height: calc(100vh - 140px); overflow: hidden; }
      @media (max-width: 1023px) {
        .board-height-wrap { height: calc(100vh - 120px - 56px - env(safe-area-inset-bottom, 0px)); }
      }
      .board-height-wrap > div { height: 100%; }
      .board-height-wrap > div > div[class*="overflow-x-auto"] {
        height: 100%;
        padding-bottom: 0;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      /* ===== Column chrome ===== */
      .board-height-wrap [data-kanban-column] {
        height: 100%;
        max-height: 100%;
        width: 18rem !important;
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        overflow: hidden;
        animation: column-fade-in 0.4s ease-out;
      }
      .board-height-wrap [data-kanban-column].opacity-60:hover { opacity: 1; }
      @media (min-width: 768px) {
        .board-height-wrap [data-kanban-column] { width: 20rem !important; }
      }
      /* Desktop — fit all swimlanes to viewport, no horizontal scroll */
      @media (min-width: 1024px) {
        .board-height-wrap [data-kanban-column] {
          flex: 1 1 0 !important;
          width: auto !important;
          min-width: 0 !important;
        }
        .board-height-wrap > div > div[class*="overflow-x-auto"] {
          overflow-x: hidden !important;
        }
      }
      @keyframes column-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ===== Empty-state text ===== */
      .board-height-wrap [data-kanban-column] > div:last-child > div.text-center {
        color: rgba(255,255,255,0.85) !important;
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }

      /* ===== Header — white text on tint ===== */
      .board-height-wrap [data-kanban-column] > div:first-child {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .board-height-wrap [data-kanban-column] > div:first-child h3 {
        color: white !important;
        text-shadow: 0 1px 2px rgba(0,0,0,0.15);
        font-weight: 600;
        font-size: 0.875rem;
        letter-spacing: 0.01em;
      }
      .board-height-wrap [data-kanban-column] > div:first-child h3 + span {
        background: rgba(255,255,255,0.4) !important;
        color: white !important;
        font-weight: 700;
        backdrop-filter: blur(4px);
      }

      /* ===== Translucent glassy cards =====
         Do NOT transition transform / position — DnD manipulates transform
         during drag + drop; a transition on it causes a slide-back flicker. */
      .board-height-wrap .bg-white {
        background: rgba(255,255,255,0.55) !important;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-color: rgba(255,255,255,0.5) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }
      .board-height-wrap .bg-white:hover {
        background: rgba(255,255,255,0.75) !important;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }

      /* ===== Custom scrollbar inside columns ===== */
      .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar { width: 6px; }
      .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
      .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.4); border-radius: 8px;
      }
      .board-height-wrap [data-kanban-column] > div:last-child::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.6);
      }
    `}</style>
  );
}