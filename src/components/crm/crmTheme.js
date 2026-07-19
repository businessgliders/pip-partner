// Shared design tokens for the Lemlii-inspired CRM redesign,
// mapped onto the Pilates in Pink palette.
export const CRM = {
  pageBg: "#faf5f0",       // warm cream (from f6eee7)
  sidebarBg: "#fbe0e2",    // soft pink
  ink: "#2d2320",          // near-black warm
  sub: "#96806f",          // muted brown-grey
  accent: "#f1889b",       // brand pink
  accentSoft: "#f7b1bd",   // blush
  blush: "#fbe0e2",
  brown: "#b67651",
  cardShadow: "0 2px 14px rgba(182,118,81,0.10)",
  cardBorder: "1px solid rgba(182,118,81,0.08)",
};

// Status → dot color, matched to the palette used across the app.
export const STATUS_DOT = {
  new: "#44403c",
  discovery: "#b45309",
  no_show: "#be123c",
  nda: "#155e75",
  fdd: "#065f46",
  signed: "#86198f",
  site_selection: "#3730a3",
  lease: "#115e59",
  build_out: "#9a3412",
  training: "#3f6212",
  closed: "#1e293b",
  ghosted: "#5b21b6",
  pending: "#ec4899",
  reviewed: "#f59e0b",
  invited: "#10b981",
  declined: "#f43f5e",
  approved: "#10b981",
};

export const dotFor = (status) => STATUS_DOT[String(status || "").toLowerCase()] || "#94a3b8";