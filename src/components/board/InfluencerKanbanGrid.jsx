import React from "react";
import DarkGlassKanbanGrid from "./DarkGlassKanbanGrid";

// Influencer-specific palette (pending / approved / declined).
// Visual parity with the legacy KanbanColumn glassmorphic theme.
const columnColors = {
  pending: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  approved: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
  declined: "from-rose-400/20 to-rose-300/20 border-rose-300/40",
};

const headerColors = {
  pending: "bg-slate-500/30 border-slate-400/40",
  approved: "bg-emerald-500/30 border-emerald-400/40",
  declined: "bg-rose-500/30 border-rose-400/40",
};

export default function InfluencerKanbanGrid(props) {
  return (
    <DarkGlassKanbanGrid
      {...props}
      boardKey="influencer"
      columnColors={columnColors}
      headerColors={headerColors}
    />
  );
}