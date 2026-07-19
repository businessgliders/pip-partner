import React from "react";
import { createPortal } from "react-dom";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { format, isBefore, startOfDay } from "date-fns";
import { displayName } from "@/components/board/boardConfig";
import { CRM } from "./crmTheme";

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
    <div className="crm-lane rounded-2xl overflow-hidden flex flex-col shadow-sm" style={{ background: palette.body, minHeight: 340 }}>
      <div className="crm-lane-header flex items-center justify-between px-3.5 py-2.5" style={{ background: palette.header }}>
        <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: CRM.ink }}>
          <span className="w-2 h-2 rounded-full" style={{ background: palette.dot }} />
          {column.label}
        </span>
        <span className="text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full bg-white/80 flex items-center justify-center" style={{ color: CRM.ink }}>
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={column.key}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-2 space-y-2">
            {tasks.length === 0 && (
              <div className="rounded-xl p-6 text-center border border-dashed" style={{ borderColor: "rgba(128,128,128,0.25)", background: "color-mix(in srgb, var(--crm-card-bg) 55%, transparent)" }}>
                <p className="text-[11px] font-semibold" style={{ color: CRM.sub }}>No tasks here yet.</p>
                <p className="text-[11px] mt-0.5" style={{ color: CRM.sub, opacity: 0.7 }}>Cards will appear here as work moves forward.</p>
              </div>
            )}
            {tasks.map((p, i) => {
              const overdue = p.due_date && isBefore(new Date(p.due_date), startOfDay(new Date()));
              const lead = p.lead_id ? leadById?.[p.lead_id] : null;
              return (
                <Draggable key={p.id} draggableId={p.id} index={i}>
                  {(prov, snapshot) => {
                    const card = (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        onClick={() => onOpen(p)}
                        className={`crm-root bg-white rounded-xl p-3 cursor-pointer transition-shadow ${snapshot.isDragging ? "shadow-2xl" : "shadow-sm hover:shadow-md"}`}
                      >
                        <div className="text-[13px] font-semibold leading-snug" style={{ color: CRM.ink }}>{p.title}</div>
                        {p.details && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: CRM.sub }}>{p.details}</p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          {lead && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: CRM.blush, color: "var(--tile-pink-fg)" }}>
                              {displayName(lead)} · {LEAD_TYPE_LABELS[p.lead_type] || p.lead_type}
                            </span>
                          )}
                          {!lead && p.lead_type && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--crm-page-bg)", color: CRM.sub }}>
                              {LEAD_TYPE_LABELS[p.lead_type] || p.lead_type}
                            </span>
                          )}
                          {p.due_date && (
                            <span
                              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={overdue ? { background: "rgba(239,68,68,0.14)", color: "#e05252" } : { background: "var(--crm-page-bg)", color: CRM.sub }}
                            >
                              Due {format(new Date(p.due_date), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                    // Portal while dragging — ancestors with CSS transforms (page
                    // entry animations) otherwise offset the card from the cursor.
                    return snapshot.isDragging ? createPortal(card, document.body) : card;
                  }}
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