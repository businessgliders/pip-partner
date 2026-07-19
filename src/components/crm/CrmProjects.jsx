import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, Search } from "lucide-react";
import CrmProjectColumn, { PROJECT_COLUMNS } from "./CrmProjectColumn";
import CrmProjectDialog from "./CrmProjectDialog";
import { CRM } from "./crmTheme";

const ICON = "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/35f492e1c_Pilatesinpinklogojusticon1.png";

const FILTERS = [
  { key: "all", label: "All projects" },
  { key: "due_soon", label: "Due soon" },
  { key: "overdue", label: "Overdue" },
];

export default function CrmProjects() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (new) | project

  const { data: projects = [] } = useQuery({
    queryKey: ["crm-projects"],
    queryFn: () => base44.entities.Project.list("-updated_date", 500),
  });

  const saveMutation = useMutation({
    mutationFn: (p) => (p.id ? base44.entities.Project.update(p.id, p) : base44.entities.Project.create(p)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-projects"] });
      setEditing(null);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-projects"] });
      setEditing(null);
    },
  });
  const moveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Project.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-projects"] }),
  });

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const soon = new Date(today.getTime() + 7 * 86400000);
    return projects.filter((p) => {
      if (q && !`${p.title} ${p.details || ""}`.toLowerCase().includes(q)) return false;
      if (filter === "due_soon") {
        if (!p.due_date) return false;
        const d = new Date(p.due_date);
        return d >= today && d <= soon;
      }
      if (filter === "overdue") {
        return !!p.due_date && new Date(p.due_date) < today;
      }
      return true;
    });
  }, [projects, filter, search]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const status = result.destination.droppableId;
    if (status !== result.source.droppableId) {
      moveMutation.mutate({ id: result.draggableId, status });
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-10">
      {/* Watermark splash behind the board */}
      <img
        src={ICON}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[80vw] opacity-[0.06] pointer-events-none select-none"
      />

      <div className="relative crm-card p-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={
                  filter === f.key
                    ? { background: CRM.blush, color: "#a34a5c" }
                    : { background: "white", color: CRM.sub, border: "1px solid rgba(182,118,81,0.12)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CRM.sub }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-9 w-40 sm:w-52 pl-8 pr-3 rounded-full text-[12px] focus:outline-none focus:ring-2 focus:ring-pink-200"
                style={{ border: "1px solid rgba(182,118,81,0.15)", color: CRM.ink }}
              />
            </div>
            <button
              type="button"
              onClick={() => setEditing({})}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold shrink-0 hover:brightness-95 transition-all"
              style={{ background: "#f6d75e", color: "#4a3a10" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          </div>
        </div>

        {/* Kanban columns */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {PROJECT_COLUMNS.map((col) => (
              <CrmProjectColumn
                key={col.key}
                column={col}
                projects={visible.filter((p) => (p.status || "backlog") === col.key)}
                onOpen={(p) => setEditing(p)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {editing !== null && (
        <CrmProjectDialog
          project={editing.id ? editing : null}
          saving={saveMutation.isPending}
          onSave={(p) => saveMutation.mutate(p)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}