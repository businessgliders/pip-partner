// Recent changelog entries — most recent first.
// To add a new entry: bump the id (e.g. "2026-05-31-a") and add to the top.
// Users will see a "new" indicator if their last_read_changelog_id is older.

export const CHANGELOG_ENTRIES = [
  {
    id: "2026-05-30-a",
    date: "May 30, 2026",
    title: "FDD countdown on cards",
    description:
      "Live 14-day FDD review countdown pill on franchise tickets with color-coded urgency.",
  },
  {
    id: "2026-05-28-a",
    date: "May 28, 2026",
    title: "FDD manual override",
    description:
      "Admins can manually start, reset, or clear the 14-day FDD waiting period.",
  },
  {
    id: "2026-05-27-a",
    date: "May 27, 2026",
    title: "Franchise email templates",
    description:
      "Standardized three franchise email templates with mandatory attendance requirements.",
  },
];

export const LATEST_CHANGELOG_ID = CHANGELOG_ENTRIES[0]?.id || null;