import React from "react";
import DarkGlassKanbanGrid from "./DarkGlassKanbanGrid";

// Instructor palette (pending / reviewed / invited; declined + ghosted go
// to the side panel and are not rendered here).
const columnColors = {
  pending: "from-slate-400/20 to-slate-300/20 border-slate-300/40",
  reviewed: "from-blue-400/20 to-blue-300/20 border-blue-300/40",
  invited: "from-emerald-400/20 to-emerald-300/20 border-emerald-300/40",
};

const headerColors = {
  pending: "bg-slate-500/30 border-slate-400/40",
  reviewed: "bg-blue-500/30 border-blue-400/40",
  invited: "bg-emerald-500/30 border-emerald-400/40",
};

export default function InstructorKanbanGrid(props) {
  return (
    <DarkGlassKanbanGrid
      {...props}
      boardKey="instructor"
      columnColors={columnColors}
      headerColors={headerColors}
    />
  );
}