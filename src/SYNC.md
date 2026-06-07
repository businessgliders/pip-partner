# Master Kanban Sync Log

Source of truth: https://github.com/businessgliders/pip-hub

## Synced Versions

| Date       | Version | Files Synced                                           | Changes                                              |
|------------|---------|--------------------------------------------------------|------------------------------------------------------|
| 2026-06-07 | 0.1.5   | All 8 files + 2 hooks (full library)                   | iOS-style drag lift + glass theme; full rebuild of spoke Kanban callsites (DarkGlassKanbanGrid, 4 per-board grids, HostedSidePanel, legacy KanbanColumn/SwimlaneScroller removed; ApplicationBoard now uses MasterKanbanBoard + MasterKanbanGlassTheme directly) |
| 2026-06-07 | 0.1.4   | All 8 files (full library)                             | Tighter board height defaults (pip-events feedback)  |
| 2026-06-07 | 0.1.3   | All 8 files (full library)                             | Responsive lane width + bounded board height prop    |
| 2026-06-06 | 0.1.2   | MasterKanbanColumn, MasterKanbanCard, index.jsx        | Theme-able classes + bareCard flag; portal z-index   |
| 2026-06-06 | 0.1.1   | MasterKanbanColumn, index.jsx, + core lib              | Re-enable drag on touch; remove isDragDisabled gate  |
| 2026-06-06 | 0.1.0   | Initial import (all 8 Master Kanban files)             | Baseline canonical Kanban                            |

## Notes

- pip-hub publishes the version file as `components/master-kanban/index.jsx` (not `.js`). Synced verbatim to the matching `.jsx` path.
- v0.1.5 rebuild: all spoke-side Kanban wrappers (`DarkGlassKanbanGrid`, `InfluencerKanbanGrid`, `InstructorKanbanGrid`, `FrontAdminKanbanGrid`, `FranchiseKanbanGrid`, `HostedSidePanel`, legacy `KanbanColumn`, `SwimlaneScroller`) were removed. `ApplicationBoard` now renders `<MasterKanbanBoard />` + `<MasterKanbanGlassTheme />` directly, with `TicketCard` as the only spoke-owned card body. Side panels and step-one/step-two switcher are gone — all statuses flow into one horizontally-scrollable swimlane row. Per-board status color palettes are centralised in `components/board/KanbanGridPalettes.js`.
- `index.css` no longer carries Kanban-specific CSS; the new `MasterKanbanGlassTheme` injects all of it at runtime.