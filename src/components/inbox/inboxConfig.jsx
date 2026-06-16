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
  scheduled: "bg-sky-100 text-sky-700",
  discussion: "bg-amber-100 text-amber-700",
  qualified: "bg-violet-100 text-violet-700",
  site_selection: "bg-indigo-100 text-indigo-700",
  lease: "bg-blue-100 text-blue-700",
  build_out: "bg-cyan-100 text-cyan-700",
  training: "bg-teal-100 text-teal-700",
  closed: "bg-slate-100 text-slate-600",
  ghosted: "bg-rose-100 text-rose-700",
  contacted: "bg-amber-100 text-amber-700",
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

export function statusOrderFor(sourceKey) {
  const b = BOARD_TYPES.find((x) => x.key === sourceKey);
  return b?.statuses || [];
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

// One-line summary preview shown in the thread list under the name+status.
export function previewLine(sourceKey, t) {
  if (!t) return "";
  if (sourceKey === "franchise") {
    return [t.preferred_location, t.province].filter(Boolean).join(" · ") || t.email || "";
  }
  if (sourceKey === "instructor" || sourceKey === "frontadmin") {
    return [t.preferred_studio, t.province].filter(Boolean).join(" · ") || t.email || "";
  }
  return t.email || "";
}