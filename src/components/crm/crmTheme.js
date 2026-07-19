// Shared design tokens for the Lemlii-inspired CRM redesign,
// mapped onto the Pilates in Pink palette. Values live as CSS variables
// (defined in src/index.css under :root and .dark) so the whole hub
// switches automatically in dark mode.
export const CRM = {
  pageBg: "var(--crm-page-bg)",
  sidebarBg: "var(--crm-sidebar-bg)",
  ink: "var(--crm-ink)",
  sub: "var(--crm-sub)",
  accent: "var(--crm-accent)",
  accentSoft: "var(--crm-accent-soft)",
  blush: "var(--crm-blush)",
  brown: "var(--crm-brown)",
  cardShadow: "var(--crm-card-shadow)",
  cardBorder: "var(--crm-card-border)",
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
  shortlisted: "#6366f1",
  invited: "#10b981",
  declined: "#f43f5e",
  approved: "#10b981",
};

export const dotFor = (status) => STATUS_DOT[String(status || "").toLowerCase()] || "#94a3b8";