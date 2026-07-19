import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { format, isBefore, startOfDay } from "date-fns";
import { displayName } from "@/components/board/boardConfig";

// Color palette cycled across swimlanes (columns are now user-defined).
export const COLUMN_PALETTES = [
  { header: "#ece5fb", body: "#f7f4fe", dot: "#a78bfa" },
  { header: "#fbe0cb", body: "#fdf2e7", dot: "#fb923c" },
  { header: "#d9e7fa", body: "#eff5fe", dot: "#60a5fa" },
  { header: "#dcf3d8", body: "#f1faef", dot: "#4ade80" },
  { header: "#fbdce4", body: "#fdf0f4", dot: "#f472b6" },
  { header: "#f8ecc9", body: "#fdf8ea", dot: "#eab308" },
];

export const LEAD_TYPE_LABELS = {
  franchise: "Franchising",
  instructor: "Instructor",
  frontadmin: "Front Desk",
  influencer: "Influencer",
};

export default function CrmProjectColumn({ column, palette, tasks, leadById, onOpen }) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ background: palette.body, minHeight: 340 }}>
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: palette.header }}>
        <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "#463a4a" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: palette.dot }} />
          {column.label}
        </span>
        <span className="text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full bg-white/80 flex items-center justify-center" style={{ color: "#463a4a" }}>
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={column.key}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-2 space-y-2">
            {tasks.length === 0 && (
              <div className="rounded-xl p-6 text-center border border-dashed" style={{ borderColor: "rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.5)" }}>
                <p className="text-[11px] font-semibold" style={{ color: "rgba(0,0,0,0.45)" }}>No tasks here yet.</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>Cards will appear here as work moves forward.</p>
              </div>
            )}
            {tasks.map((p, i) => {
              const overdue = p.due_date && isBefore(new Date(p.due_date), startOfDay(new Date()));
              const lead = p.lead_id ? leadById?.[p.lead_id] : null;
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
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {lead && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fbe0e2", color: "#a34a5c" }}>
                            {displayName(lead)} · {LEAD_TYPE_LABELS[p.lead_type] || p.lead_type}
                          </span>
                        )}
                        {!lead && p.lead_type && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f4f0ea", color: "#7a6a58" }}>
                            {LEAD_TYPE_LABELS[p.lead_type] || p.lead_type}
                          </span>
                        )}
                        {p.due_date && (
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={overdue ? { background: "#fee2e2", color: "#b91c1c" } : { background: "#f4f0ea", color: "#7a6a58" }}
                          >
                            Due {format(new Date(p.due_date), "MMM d")}
                          </span>
                        )}
                      </div>
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