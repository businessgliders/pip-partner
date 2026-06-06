/**
 * Master Kanban — canonical kanban primitives for the PiP ecosystem.
 *
 * Version is stamped so each spoke can record which version it has synced.
 * Bump on any breaking change to the public API of these components/hooks.
 *
 * Changelog:
 *   0.1.1 — Re-enable drag on touch viewports.
 *           * MasterKanbanColumn no longer gates Draggable with
 *             useIsTouchViewport / isDragDisabled. Drag now works on
 *             mobile + tablet (matches pip-support's working pattern).
 *             The portal-to-body trick handles pointer alignment.
 *             `useIsTouchViewport` hook is still exported for spokes
 *             that want it for other purposes.
 *   0.1.0 — Initial tagged release.
 *           + useIsTouchViewport hook (disables DnD on mobile, fixes touch
 *             scroll hijacking — borrowed from pip-partner)
 *           + MasterKanbanColumn now accepts optional `description` per
 *             column (renders as a small subtitle under the title)
 */
export const MASTER_KANBAN_VERSION = "0.1.1";

export { default as MasterKanbanBoard } from "./MasterKanbanBoard";
export { default as MasterKanbanColumn } from "./MasterKanbanColumn";
export { default as MasterKanbanCard } from "./MasterKanbanCard";
export { default as MasterSwimlaneScroller } from "./MasterSwimlaneScroller";
export { default as MasterBoardTabs } from "./MasterBoardTabs";
export { default as useHorizontalScroll } from "@/hooks/useHorizontalScroll";
export { default as useIsTouchViewport } from "@/hooks/useIsTouchViewport";