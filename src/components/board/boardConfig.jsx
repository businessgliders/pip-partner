// Per-entity board configuration.
// `categoryField`: which field drives the "View by Category" columns. null = hide toggle.

// Per-board status display: label (overrides the raw status key) + tiny description
// shown under the swimlane title. Falls back to the raw key when no entry exists.
export const STATUS_META = {
  franchise: {
    new: { label: "New", description: "Just submitted — needs first outreach" },
    discovery: { label: "Discovery", description: "Discovery call booked or held" },
    no_show: { label: "No Show", description: "Missed the scheduled discovery call" },
    nda: { label: "NDA", description: "NDA sent — awaiting signature" },
    fdd: { label: "FDD", description: "FDD shared — 14-day review period" },
    signed: { label: "Signed", description: "Franchise agreement signed" },
    site_selection: { label: "Site Selection", description: "Scouting and approving the studio location" },
    lease: { label: "Lease", description: "Negotiating and signing the lease" },
    build_out: { label: "Build-Out", description: "Construction and studio fit-out in progress" },
    training: { label: "Training", description: "Owner and staff onboarding before launch" },
    closed: { label: "Not Interested", description: "Lead opted out or was disqualified" },
    ghosted: { label: "Ghosted", description: "No reply after multiple follow-ups" },
  },
  instructor: {
    declined: { label: "Not Interested", description: "Lead opted out or was disqualified" },
  },
  frontadmin: {
    declined: { label: "Not Interested", description: "Lead opted out or was disqualified" },
  },
  influencer: {
    declined: { label: "Not Interested", description: "Lead opted out or was disqualified" },
  },
};

export function getStatusMeta(boardKey, status) {
  return STATUS_META?.[boardKey]?.[status] || null;
}

export function getStatusLabel(boardKey, status) {
  return getStatusMeta(boardKey, status)?.label || status;
}

export const BOARD_TYPES = [
  {
    key: "franchise",
    label: "Franchise",
    entity: "FranchiseInquiry",
    tabKey: "franchise",
    statuses: ["new", "discovery", "no_show", "nda", "fdd", "signed", "ghosted", "site_selection", "lease", "build_out", "training", "closed"],
    stepOne: ["new", "discovery", "no_show", "nda", "fdd", "signed"],
    stepTwo: ["site_selection", "lease", "build_out", "training"],
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