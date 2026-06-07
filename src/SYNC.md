# Master Kanban Sync Log

Source of truth: https://github.com/businessgliders/pip-hub

## Synced Versions

| Date       | Version | Files Synced                                           | Changes                                              |
|------------|---------|--------------------------------------------------------|------------------------------------------------------|
| 2026-06-07 | 0.1.4   | All 8 files (full library)                             | Tighter board height defaults (pip-events feedback)  |
| 2026-06-07 | 0.1.3   | All 8 files (full library)                             | Responsive lane width + bounded board height prop    |
| 2026-06-06 | 0.1.2   | MasterKanbanColumn, MasterKanbanCard, index.jsx        | Theme-able classes + bareCard flag; portal z-index   |
| 2026-06-06 | 0.1.1   | MasterKanbanColumn, index.jsx, + core lib              | Re-enable drag on touch; remove isDragDisabled gate  |
| 2026-06-06 | 0.1.0   | Initial import (all 8 Master Kanban files)             | Baseline canonical Kanban                            |

## Notes

- pip-hub publishes the version file as `components/master-kanban/index.jsx` (not `.js`). Synced verbatim to the matching `.jsx` path.
- This was the first sync for pip-partner — no prior Master files existed; nothing was overwritten.
- Old spoke files (`components/board/KanbanColumn.jsx`, `TicketCard.jsx`, `SwimlaneScroller.jsx`) are still in use by `pages/ApplicationBoard` and were **not** touched. Callsite migration is a separate task.