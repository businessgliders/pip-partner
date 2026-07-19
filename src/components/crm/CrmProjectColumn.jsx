import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { format, isBefore, startOfDay } from "date-fns";

export const PROJECT_COLUMNS = [
  { key: "backlog", label: "Backlog", header: "#ece5fb", body: "#f7f4fe", dot: "#a78bfa" },
  { key: "working", label: "Working on it", header: "#fbe0cb", body: "#fdf2e7", dot: "#fb923c" },
  { key: "sent", label: "Sent", header: "#d9e7fa", body: "#eff5fe", dot: "#60a5fa" },
  { key: "downloaded", label: "Downloaded", header: "#dcf3d8", body: "#f1faef", dot: "#4ade80" },
];

export default function CrmProjectColumn({ column, projects, onOpen }) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ background: column.body, minHeight: 340 }}>
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: column.header }}>
        <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "#463a4a" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: column.dot }} />
          {column.label}
        </span>
        <span className="text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full bg-white/80 flex items-center justify-center" style={{ color: "#463a4a" }}>
          {projects.length}
        </span>
      </div>
      <Droppable droppableId={column.key}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-2 space-y-2">
            {projects.length === 0 && (
              <div className="rounded-xl p-6 text-center border border-dashed" style={{ borderColor: "rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.5)" }}>
                <p className="text-[11px] font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>No projects here yet.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>Cards will appear here as work moves forward.</p>
              </div>
            )}
            {projects.map((p, i) => {
              const overdue = p.due_date && isBefore(new Date(p.due_date), startOfDay(new Date()));
              return (
                <Draggable key={p.id} draggableId={p.id} index={i}>
                  {(prov) => (
                    <div
                      ref={prov.innerRef}
                      {...prov.draggableProps}
                      {...prov.dragHandleProps}
                      onClick={() => onOpen(p)}
                      className="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="text-[13px] font-semibold leading-snug" style={{ color: "#2f2430" }}>{p.title}</div>
                      {p.details && (
                        <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "rgba(0,0,0,0.45)" }}>{p.details}</p>
                      )}
                      {p.due_date && (
                        <span
                          className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={overdue ? { background: "#fee2e2", color: "#b91c1c" } : { background: "#f4f0ea", color: "#7a6a58" }}
                        >
                          Due {format(new Date(p.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}