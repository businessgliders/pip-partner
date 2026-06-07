/**
 * Master Kanban — canonical kanban primitives for the PiP ecosystem.
 *
 * Version is stamped so each spoke can record which version it has synced.
 * Bump on any breaking change to the public API of these components/hooks.
 *
 * Changelog:
 *   0.1.4 — Tighter board height defaults (from pip-events feedback).
 *           * MasterKanbanBoard: default `boardHeightClasses` changed from
 *             `h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]` to
 *             `h-[calc(100dvh-140px)] md:h-[calc(100dvh-120px-56px-env(safe-area-inset-bottom,0px))]`.
 *             Aligns with actual header heights (~140px desktop / ~120px mobile),
 *             allowing swimlanes to fill available space before tab bar.
 *           Back-compatible: spokes passing custom boardHeightClasses override
 *           the new default.
 *   0.1.3 — Responsive default sizing + bounded board height.
 *           * MasterKanbanColumn default shellClasses width:
 *             `w-80` → `w-[42vw] md:w-72 lg:w-80`. Phones/portrait tablets
 *             now show ~2.5 lanes (signals horizontal scrollability);
 *             desktop unchanged at 320px.
 *           * MasterKanbanColumn default shellClasses now includes `h-full`
 *             so columns fill the bounded board row.
 *           + MasterKanbanBoard: new optional `boardHeightClasses` prop
 *             (default `h-[calc(100dvh-220px)] md:h-[calc(100dvh-180px)]`).
 *             Applied to the horizontal scroll row so each column's inner
 *             list scrolls independently — column headers stay put, page
 *             doesn't grow with ticket count. Spokes can override per-app
 *             (e.g. if their chrome above the board is taller/shorter).
 *           Back-compatible: any callsite that was passing custom
 *           shellClasses continues to override the new defaults.
 *   0.1.2 — Theme-able columns & cards (back-compatible).
 *           + MasterKanbanColumn: new optional className props
 *             shellClasses, listClasses, titleClasses, countBadgeClasses,
 *             descriptionClasses, emptyClasses. All default to the previous
 *             hard-coded values — existing callsites unaffected.
 *           + MasterKanbanColumn: new optional `bareCard` prop, forwarded
 *             to MasterKanbanCard.
 *           + MasterKanbanCard: new optional `bareCard` prop. When true,
 *             skips the default white chrome (bg/border/padding/shadow + drag
 *             border) so a spoke's renderContent can supply a fully-styled card
 *             (e.g. pip-partner's dark glassmorphic Influencer board) without
 *             ending up with a double card background.
 *           * Dragged item gets inline z-index 9999 to prevent layering
 *             surprises against blurred / overlay ancestors.
 *           * Card wrapper now always has rounded-xl so the highlight ring
 *             follows the card shape (also when bareCard is on).
 *           * Unread badge bumped to z-10 so it stays above a custom inner
 *             card body.
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
export const MASTER_KANBAN_VERSION = "0.1.4";

export { default as MasterKanbanBoard } from "./MasterKanbanBoard";
export { default as MasterKanbanColumn } from "./MasterKanbanColumn";
export { default as MasterKanbanCard } from "./MasterKanbanCard";
export { default as MasterSwimlaneScroller } from "./MasterSwimlaneScroller";
export { default as MasterBoardTabs } from "./MasterBoardTabs";
export { default as useHorizontalScroll } from "@/hooks/useHorizontalScroll";
export { default as useIsTouchViewport } from "@/hooks/useIsTouchViewport";