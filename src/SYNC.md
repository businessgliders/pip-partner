# Master Kanban Sync Guide

This document is for **spoke agents** (in pip-events, pip-partner, pip-support) syncing the Master Kanban components from pip-hub.

**TL;DR:** Fetch 8 files from `raw.githubusercontent.com/businessgliders/pip-hub/main/src/`, overwrite your locals, check the changelog for breaking changes, patch callsites if needed, update your README.

---

## Files to sync

All files are fetched from `https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/` and placed at the same relative path in your spoke.

| File | Source URL |
|---|---|
| `components/master-kanban/index.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/index.js` |
| `components/master-kanban/MasterKanbanBoard.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanBoard.jsx` |
| `components/master-kanban/MasterKanbanColumn.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanColumn.jsx` |
| `components/master-kanban/MasterKanbanCard.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanCard.jsx` |
| `components/master-kanban/MasterBoardTabs.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterBoardTabs.jsx` |
| `components/master-kanban/MasterSwimlaneScroller.jsx` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterSwimlaneScroller.jsx` |
| `hooks/useHorizontalScroll.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useHorizontalScroll.js` |
| `hooks/useIsTouchViewport.js` | `raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useIsTouchViewport.js` |

---

## Sync procedure

1. **Fetch all 8 files** from the URLs above and overwrite your local copies.

2. **Read the changelog** in `components/master-kanban/index.js` (top of the file, after the version export). Note the current version you have and the new version you're syncing to.

3. **Check for BREAKING changes** in the changelog between your current version and the new one:
   - If any entry says `[BREAKING]` or `[⚠️ BREAKING]`, a callsite change is required.
   - If only patch/minor updates, no changes needed — you can skip to step 5.

4. **If breaking changes:** Find every callsite in your spoke that uses the affected components and rewrite per the changelog instructions. Test the board.

5. **Update your README** — add a line: `Master Kanban synced to vX.Y.Z on YYYY-MM-DD from pip-hub@<commit-hash>`

6. **Commit and push.**

---

## Governance

- Master Kanban files are READ-ONLY in spokes. Do not edit them locally.
- Spoke-specific customizations go outside the master files.
- `MASTER_KANBAN_VERSION` in `components/master-kanban/index.js` is your source of truth.