import React from "react";
import DarkGlassKanbanGrid from "./DarkGlassKanbanGrid";

// Franchise palette — matches the legacy KanbanColumn glassmorphic theme
// keyed by franchise status. Side-panel statuses (closed / ghosted) are not
// rendered through this grid so they're omitted.
const columnColors = {
  new: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  scheduled: "from-orange-400/20 to-orange-300/20 border-orange-300/40",
  discussion: "from-amber-400/20 to-amber-300/20 border-amber-300/40",
  contacted: "from-purple-400/20 to-purple-300/20 border-purple-300/40",
  qualified: "from-pink-400/20 to-pink-300/20 border-pink-300/40",
  site_selection: "from-cyan-400/20 to-cyan-300/20 border-cyan-300/40",
  lease: "from-indigo-400/20 to-indigo-300/20 border-indigo-300/40",
  build_out: "from-violet-400/20 to-violet-300/20 border-violet-300/40",
  training: "from-teal-400/20 to-teal-300/20 border-teal-300/40",
};

const headerColors = {
  new: "bg-slate-500/30 border-slate-400/40",
  scheduled: "bg-orange-500/30 border-orange-400/40",
  discussion: "bg-amber-500/30 border-amber-400/40",
  contacted: "bg-purple-500/30 border-purple-400/40",
  qualified: "bg-pink-500/30 border-pink-400/40",
  site_selection: "bg-cyan-500/30 border-cyan-400/40",
  lease: "bg-indigo-500/30 border-indigo-400/40",
  build_out: "bg-violet-500/30 border-violet-400/40",
  training: "bg-teal-500/30 border-teal-400/40",
};

export default function FranchiseKanbanGrid(props) {
  return (
    <DarkGlassKanbanGrid
      {...props}
      boardKey="franchise"
      columnColors={columnColors}
      headerColors={headerColors}
    />
  );
}