// Recent changelog entries — most recent first.
// To add a new entry: bump the id (e.g. "2026-05-31-a") and add to the top.
// Users will see a "new" indicator if their last_read_changelog_id is older.

export const CHANGELOG_ENTRIES = [
  {
    id: "2026-05-30-a",
    date: "May 30, 2026",
    title: "FDD countdown on cards",
    description:
      "Franchise ticket cards now show a live 14-day FDD review countdown pill, with color cues as the deadline approaches.",
  },
  {
    id: "2026-05-29-a",
    date: "May 29, 2026",
    title: "Tablet kanban navigation",
    description:
      "Swimlane arrow navigation now works on tablet view, making it easier to page through columns on iPad-sized screens.",
  },
  {
    id: "2026-05-28-a",
    date: "May 28, 2026",
    title: "FDD manual override",
    description:
      "Admins can now manually start, reset, or clear the 14-day FDD waiting period from the submission detail modal.",
  },
  {
    id: "2026-05-27-a",
    date: "May 27, 2026",
    title: "Franchise email templates",
    description:
      "Standardized three franchise email templates, including a mandatory attendance requirement for Part 2 Discovery Calls.",
  },
  {
    id: "2026-05-26-a",
    date: "May 26, 2026",
    title: "Resolved cleanup automation",
    description:
      "Ticket cleanup popup now auto-triggers for batches of 5 or more resolved tickets to keep your board tidy.",
  },
];

export const LATEST_CHANGELOG_ID = CHANGELOG_ENTRIES[0]?.id || null;