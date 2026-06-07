/**
 * Master Kanban — canonical kanban primitives for the PiP ecosystem.
 *
 * Version is stamped so each spoke can record which version it has synced.
 * Bump on any breaking change to the public API of these components/hooks.
 *
 * Changelog:
 *   0.1.5 — iOS-style drag feel synced from pip-events (now the default).
 *           + NEW DragLiftWrapper: dragged card "pops" with a springy
 *             scale(1.04) + rotate(1.5deg) and fires a short haptic on pickup.
 *           * MasterKanbanColumn: each card is wrapped in DragLiftWrapper;
 *             adds iOS touch styles (userSelect/touchCallout/touchAction) and
 *             data-kanban-list on the list. Archive All now always renders
 *             (disabled when the column is empty).
 *           * MasterKanbanBoard: onDragStart/onDragEnd toggle a `dnd-dragging`
 *             body class + injected <style> that freezes page & column scroll
 *             during drag, so only the card moves under the finger (matches
 *             desktop mouse-drag feel). Sticky headers/page don't pan.
 *           * MasterKanbanCard: drag chrome (shadow lift + tinted border) is
 *             no longer gated behind !bareCard, so glass/dark cards lift too.
 *           + NEW MasterKanbanGlassTheme: drop-in CSS theme for glassmorphic
 *             dark/tinted boards. Spokes can render <MasterKanbanGlassTheme />
 *             alongside <MasterKanbanBoard /> to get the pip-events visual.
 *   0.1.4 — Tighter board height defaults (from pip-events feedback).
 *   0.1.3 — Responsive default sizing + bounded board height.
 *   0.1.2 — Theme-able columns & cards (back-compatible).
 *   0.1.1 — Re-enable drag on touch viewports.
 *   0.1.0 — Initial tagged release.
 */
export const MASTER_KANBAN_VERSION = "0.1.5";

export { default as MasterKanbanBoard } from "./MasterKanbanBoard";
export { default as DragLiftWrapper } from "./DragLiftWrapper";
export { default as MasterKanbanGlassTheme } from "./MasterKanbanGlassTheme";
export { default as MasterKanbanColumn } from "./MasterKanbanColumn";
export { default as MasterKanbanCard } from "./MasterKanbanCard";
export { default as MasterSwimlaneScroller } from "./MasterSwimlaneScroller";
export { default as MasterBoardTabs } from "./MasterBoardTabs";
export { default as useHorizontalScroll } from "@/hooks/useHorizontalScroll";
export { default as useIsTouchViewport } from "@/hooks/useIsTouchViewport";