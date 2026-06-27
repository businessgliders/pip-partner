// Shared config + helpers for the Inbox view on the Application Board.
// Source = board key (franchise / instructor / frontadmin). Each has its own
// brand accent, status pipeline, and chip styles.

import { BOARD_TYPES, getStatusLabel } from "@/components/board/boardConfig";

// Inbox view supports these three sources (Influencer uses its own existing board).
export const INBOX_SOURCES = ["franchise", "instructor", "frontadmin"];

export const SOURCE_META = {
  franchise: { label: "Franchise", accent: "#b67651", soft: "rgba(182, 118, 81, 0.12)" },
  instructor: { label: "Instructor", accent: "#c4896b", soft: "rgba(196, 137, 107, 0.12)" },
  frontadmin: { label: "Front Desk", accent: "#d4a088", soft: "rgba(212, 160, 136, 0.12)" },
};

// Color chips per generic status. Falls back to a slate chip for unknowns.
const STATUS_CHIPS = {
  // Franchise pipeline
  new: "bg-emerald-100 text-emerald-700",
  discovery: "bg-amber-100 text-amber-700",
  no_show: "bg-rose-100 text-rose-700",
  nda: "bg-cyan-100 text-cyan-700",
  fdd: "bg-violet-100 text-violet-700",
  signed: "bg-fuchsia-100 text-fuchsia-700",
  site_selection: "bg-indigo-100 text-indigo-700",
  lease: "bg-blue-100 text-blue-700",
  build_out: "bg-cyan-100 text-cyan-700",
  training: "bg-teal-100 text-teal-700",
  closed: "bg-slate-100 text-slate-600",
  ghosted: "bg-rose-100 text-rose-700",
  // Instructor / Front Desk pipeline
  pending: "bg-emerald-100 text-emerald-700",
  reviewed: "bg-amber-100 text-amber-700",
  invited: "bg-sky-100 text-sky-700",
  declined: "bg-rose-100 text-rose-700",
};

export function statusChip(status) {
  return STATUS_CHIPS[status] || "bg-slate-100 text-slate-600";
}

export function statusLabel(boardKey, status) {
  return getStatusLabel(boardKey, status);
}

// Per-source inbox status grouping for the left rail. Each entry has an
// optional `label` (heading shown above the group) and an ordered list of
// status keys. Sources without an entry fall back to a single ungrouped list
// of all the board's statuses.
// Pseudo-status key used by the rail to surface tickets with an UPCOMING
// Cal.com booking, regardless of their pipeline status. It's not a real
// entity status — InboxView intercepts it during filtering.
export const UPCOMING_MEETINGS_KEY = "upcoming";

export const INBOX_STATUS_GROUPS = {
  franchise: [
    { statuses: [UPCOMING_MEETINGS_KEY] },
    { label: "Step 1", statuses: ["new", "discovery", "no_show", "nda", "fdd", "signed"] },
    { label: "Step 2", statuses: ["site_selection", "lease", "build_out", "training"] },
    { label: "Other", statuses: ["ghosted", "closed"] },
  ],
  instructor: [
    { statuses: ["pending", "reviewed", "invited"] },
    { label: "Other", statuses: ["declined", "ghosted"] },
  ],
  frontadmin: [
    { statuses: ["pending", "reviewed", "invited"] },
    { label: "Other", statuses: ["declined", "ghosted"] },
  ],
};

// STATUS_FOLD_MAP is kept (currently empty) so callers can keep importing it
// without breaking — legacy franchise statuses (scheduled/discussion/...) were
// removed from the schema and migrated into "discovery".
export const STATUS_FOLD_MAP = {};

export function expandStatusFilter(sourceKey, status) {
  const folded = STATUS_FOLD_MAP[sourceKey]?.[status];
  return folded ? [status, ...folded] : [status];
}

// The "Not Interested" status key per source — franchise uses `closed`,
// instructor/frontadmin/influencer use `declined`. Archived tickets are
// merged into this bucket in the inbox so they're reachable from one place.
export function notInterestedStatusFor(sourceKey) {
  return sourceKey === "franchise" ? "closed" : "declined";
}

export function statusGroupsFor(sourceKey) {
  if (INBOX_STATUS_GROUPS[sourceKey]) return INBOX_STATUS_GROUPS[sourceKey];
  const b = BOARD_TYPES.find((x) => x.key === sourceKey);
  return [{ statuses: b?.statuses || [] }];
}

export function statusOrderFor(sourceKey) {
  return statusGroupsFor(sourceKey).flatMap((g) => g.statuses);
}

export function entityForSource(sourceKey) {
  return BOARD_TYPES.find((x) => x.key === sourceKey)?.entity;
}

// Person-related helpers
export function displayName(t) {
  if (!t) return "Unknown";
  if (t.full_name) return t.full_name;
  const fn = `${t.first_name || ""} ${t.last_name || ""}`.trim();
  return fn || t.email || "Unknown";
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarGradient(seed = "") {
  const palettes = [
    "from-pink-400 to-rose-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-fuchsia-400 to-pink-500",
    "from-orange-300 to-amber-500",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % palettes.length;
  return palettes[Math.abs(h)];
}

export function relativeTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Sentence-case helper: capitalizes the first letter of each
// space/comma/hyphen-separated word. Used so user-entered location strings
// (often typed all lowercase) render cleanly in the inbox.
function toSentenceCase(s) {
  if (!s) return s;
  return String(s).toLowerCase().replace(/(^|[\s,\-/])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// Compact form for the available_capital field (e.g. "$200K - $300K" → "$200–300K").
function compactCapital(s) {
  if (!s) return "";
  const str = String(s);
  const m = str.match(/\$?\s*(\d+)\s*K\s*-\s*\$?\s*(\d+)\s*K/i);
  if (m) return `$${m[1]}–${m[2]}K`;
  return str.replace(/\s+/g, " ").trim();
}

// One-line summary preview shown in the thread list under the name+status.
export function previewLine(sourceKey, t) {
  if (!t) return "";
  if (sourceKey === "franchise") {
    const parts = [toSentenceCase(t.preferred_location), t.province].filter(Boolean);
    if (t.available_capital) parts.push(compactCapital(t.available_capital));
    return parts.join(" · ") || t.email || "";
  }
  if (sourceKey === "instructor" || sourceKey === "frontadmin") {
    return [toSentenceCase(t.preferred_studio), t.province].filter(Boolean).join(" · ") || t.email || "";
  }
  return t.email || "";
}