# Master Kanban Sync Log

Source of truth: https://github.com/businessgliders/pip-hub

## Synced Versions

| Date       | Version | Files Synced                                           | Changes                                              |
|------------|---------|--------------------------------------------------------|------------------------------------------------------|
| 2026-06-06 | 0.1.1   | MasterKanbanColumn, index.jsx, + core lib              | Re-enable drag on touch; remove isDragDisabled gate  |
| 2026-06-06 | 0.1.0   | Initial import (all 8 Master Kanban files)             | Baseline canonical Kanban                            |

## Notes

- pip-hub publishes the version file as `components/master-kanban/index.jsx` (not `.js`). Synced verbatim to the matching `.jsx` path.
- This was the first sync for pip-partner — no prior Master files existed; nothing was overwritten.
- Old spoke files (`components/board/KanbanColumn.jsx`, `TicketCard.jsx`, `SwimlaneScroller.jsx`) are still in use by `pages/ApplicationBoard` and were **not** touched. Callsite migration is a separate task.