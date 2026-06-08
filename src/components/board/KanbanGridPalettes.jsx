// Per-board status color palette for the dark-glass Kanban grid.
// Each entry provides `colorClasses` (column shell gradient + border) and
// `headerClasses` (header tint) consumed by MasterKanbanColumn.
// Falls back to a neutral white-glass palette when a status isn't listed.

const FRANCHISE = {
  new:            { colorClasses: "from-stone-600/40 to-stone-500/20 border-stone-400/50",     headerClasses: "bg-stone-700/70 border-stone-600/60" },
  scheduled:      { colorClasses: "from-amber-700/35 to-amber-600/15 border-amber-500/50",   headerClasses: "bg-amber-700/70 border-amber-600/60" },
  discussion:     { colorClasses: "from-amber-600/35 to-amber-500/15 border-amber-500/50",   headerClasses: "bg-amber-700/70 border-amber-600/60" },
  qualified:      { colorClasses: "from-emerald-700/35 to-emerald-600/15 border-emerald-500/50", headerClasses: "bg-emerald-800/70 border-emerald-700/60" },
  site_selection: { colorClasses: "from-indigo-700/35 to-indigo-600/15 border-indigo-500/50",   headerClasses: "bg-indigo-800/70 border-indigo-700/60" },
  lease:          { colorClasses: "from-teal-700/35 to-teal-600/15 border-teal-500/50",         headerClasses: "bg-teal-800/70 border-teal-700/60" },
  build_out:      { colorClasses: "from-orange-700/35 to-orange-600/15 border-orange-500/50",   headerClasses: "bg-orange-800/70 border-orange-700/60" },
  training:       { colorClasses: "from-lime-700/35 to-lime-600/15 border-lime-500/50",         headerClasses: "bg-lime-800/70 border-lime-700/60" },
  closed:         { colorClasses: "from-slate-700/35 to-slate-600/15 border-slate-500/50",      headerClasses: "bg-slate-800/70 border-slate-700/60" },
  ghosted:        { colorClasses: "from-slate-700/35 to-slate-600/15 border-slate-500/50",       headerClasses: "bg-slate-800/70 border-slate-700/60" },
  contacted:      { colorClasses: "from-cyan-700/35 to-cyan-600/15 border-cyan-500/50",         headerClasses: "bg-cyan-800/70 border-cyan-700/60" },
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