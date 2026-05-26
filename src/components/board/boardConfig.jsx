// Per-entity board configuration.
// `categoryField`: which field drives the "View by Category" columns. null = hide toggle.

export const BOARD_TYPES = [
  {
    key: "franchise",
    label: "Franchise",
    entity: "FranchiseInquiry",
    tabKey: "franchise",
    statuses: ["new", "scheduled", "ghosted", "qualified", "closed"],
    categoryField: "province",
    color: "#b67651",
    bg: "#fbe0e2",
  },
  {
    key: "instructor",
    label: "Instructor",
    entity: "InstructorApplication",
    tabKey: "instructor",
    statuses: ["pending", "reviewed", "ghosted", "invited", "declined"],
    categoryField: "province",
    color: "#c4896b",
    bg: "#f6eee7",
  },
  {
    key: "frontadmin",
    label: "Front Desk",
    entity: "FrontAdminApplication",
    tabKey: "frontadmin",
    statuses: ["pending", "reviewed", "ghosted", "invited", "declined"],
    categoryField: "province",
    color: "#d4a088",
    bg: "#faf3ec",
  },
  {
    key: "influencer",
    label: "Influencer",
    entity: "InfluencerApplication",
    tabKey: "influencer",
    statuses: ["pending", "approved", "declined"],
    categoryField: null,
    color: "#f1889b",
    bg: "#fce8ee",
  },
];

export function displayName(t) {
  if (t?.full_name) return t.full_name;
  const fn = `${t?.first_name || ""} ${t?.last_name || ""}`.trim();
  return fn || t?.email || "Unknown";
}