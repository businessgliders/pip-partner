// Per-board status color palette for the dark-glass Kanban grid.
// Each entry provides `colorClasses` (column shell gradient + border) and
// `headerClasses` (header tint) consumed by MasterKanbanColumn.
// Falls back to a neutral white-glass palette when a status isn't listed.

const FRANCHISE = {
  new:            { colorClasses: "from-pink-400/30 to-pink-300/15 border-pink-300/40",   headerClasses: "bg-pink-500/50 border-pink-300/50" },
  scheduled:      { colorClasses: "from-amber-400/30 to-amber-300/15 border-amber-300/40", headerClasses: "bg-amber-500/50 border-amber-300/50" },
  discussion:     { colorClasses: "from-sky-400/30 to-sky-300/15 border-sky-300/40",       headerClasses: "bg-sky-500/50 border-sky-300/50" },
  qualified:      { colorClasses: "from-emerald-400/30 to-emerald-300/15 border-emerald-300/40", headerClasses: "bg-emerald-500/50 border-emerald-300/50" },
  site_selection: { colorClasses: "from-indigo-400/30 to-indigo-300/15 border-indigo-300/40",   headerClasses: "bg-indigo-500/50 border-indigo-300/50" },
  lease:          { colorClasses: "from-teal-400/30 to-teal-300/15 border-teal-300/40",         headerClasses: "bg-teal-500/50 border-teal-300/50" },
  build_out:      { colorClasses: "from-orange-400/30 to-orange-300/15 border-orange-300/40",   headerClasses: "bg-orange-500/50 border-orange-300/50" },
  training:       { colorClasses: "from-lime-400/30 to-lime-300/15 border-lime-300/40",         headerClasses: "bg-lime-500/50 border-lime-300/50" },
  closed:         { colorClasses: "from-violet-400/25 to-purple-300/15 border-violet-300/40",   headerClasses: "bg-violet-500/50 border-violet-300/50" },
  ghosted:        { colorClasses: "from-slate-400/25 to-slate-300/15 border-slate-300/40",       headerClasses: "bg-slate-500/50 border-slate-300/50" },
  contacted:      { colorClasses: "from-cyan-400/30 to-cyan-300/15 border-cyan-300/40",         headerClasses: "bg-cyan-500/50 border-cyan-300/50" },
};

const HIRING = {
  pending:  { colorClasses: "from-pink-400/30 to-pink-300/15 border-pink-300/40",       headerClasses: "bg-pink-500/50 border-pink-300/50" },
  reviewed: { colorClasses: "from-amber-400/30 to-amber-300/15 border-amber-300/40",     headerClasses: "bg-amber-500/50 border-amber-300/50" },
  invited:  { colorClasses: "from-emerald-400/30 to-emerald-300/15 border-emerald-300/40", headerClasses: "bg-emerald-500/50 border-emerald-300/50" },
  declined: { colorClasses: "from-rose-400/25 to-red-300/15 border-rose-300/40",         headerClasses: "bg-rose-500/50 border-rose-300/50" },
  ghosted:  { colorClasses: "from-slate-400/25 to-slate-300/15 border-slate-300/40",      headerClasses: "bg-slate-500/50 border-slate-300/50" },
};

const INFLUENCER = {
  pending:  { colorClasses: "from-pink-400/30 to-pink-300/15 border-pink-300/40",         headerClasses: "bg-pink-500/50 border-pink-300/50" },
  approved: { colorClasses: "from-emerald-400/30 to-emerald-300/15 border-emerald-300/40", headerClasses: "bg-emerald-500/50 border-emerald-300/50" },
  declined: { colorClasses: "from-rose-400/25 to-red-300/15 border-rose-300/40",          headerClasses: "bg-rose-500/50 border-rose-300/50" },
};

export const BOARD_PALETTES = {
  franchise: FRANCHISE,
  instructor: HIRING,
  frontadmin: HIRING,
  influencer: INFLUENCER,
};

const FALLBACK = { colorClasses: "from-white/20 to-white/10 border-white/30", headerClasses: "bg-white/30 border-white/40" };

export function getColumnPalette(boardKey, status) {
  return BOARD_PALETTES[boardKey]?.[status] || FALLBACK;
}