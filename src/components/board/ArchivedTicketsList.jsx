import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ACCENT = "#b67651";

function getClosedDate(ticket) {
  const history = ticket.status_history || [];
  const closedEntry = [...history].reverse().find((h) => /closed|declined/i.test(h.status || ""));
  const ts = closedEntry?.timestamp || history[history.length - 1]?.timestamp || ticket.created_date;
  if (!ts) return null;
  const iso = /Z|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts + "Z";
  return new Date(iso);
}

function fmtMonth(y, m) {
  return new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ArchivedTicketsList({ tickets, onView, onRestore }) {
  const grouped = useMemo(() => {
    const map = {};
    (tickets || []).forEach((t) => {
      const d = getClosedDate(t);
      if (!d) return;
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!map[y]) map[y] = {};
      if (!map[y][m]) map[y][m] = [];
      map[y][m].push({ ...t, _closedAt: d });
    });
    return map;
  }, [tickets]);

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);
  const [expandedYears, setExpandedYears] = useState(() => new Set(years.slice(0, 1)));
  const initialMonth = years[0] != null ? Math.max(...Object.keys(grouped[years[0]]).map(Number)) : null;
  const [selected, setSelected] = useState(initialMonth != null ? { y: years[0], m: initialMonth } : null);

  if (!years.length) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-12 text-center shadow-xl flex-1">
        <Archive className="w-10 h-10 mx-auto text-white/60 mb-2" />
        <p className="text-white/80 text-sm">No archived applications</p>
      </div>
    );
  }

  const toggleYear = (y) => {
    const next = new Set(expandedYears);
    if (next.has(y)) next.delete(y); else next.add(y);
    setExpandedYears(next);
  };

  const monthRows = selected ? (grouped[selected.y]?.[selected.m] || []) : [];

  return (
    <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-xl flex-1 overflow-y-auto">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        <aside className="md:w-60 flex-shrink-0">
          <h3 className="text-white font-semibold mb-3">Archive</h3>
          <div className="space-y-1">
            {years.map((y) => {
              const yearTotal = Object.values(grouped[y]).reduce((s, arr) => s + arr.length, 0);
              const months = Object.keys(grouped[y]).map(Number).sort((a, b) => b - a);
              const isOpen = expandedYears.has(y);
              return (
                <div key={y}>
                  <button
                    onClick={() => toggleYear(y)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-white/90 hover:bg-white/10 text-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {y}
                    </span>
                    <Badge className="bg-white/20 text-white border-0">{yearTotal}</Badge>
                  </button>
                  {isOpen && (
                    <div className="ml-5 space-y-0.5 mt-0.5">
                      {months.map((m) => {
                        const isSel = selected?.y === y && selected?.m === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setSelected({ y, m })}
                            className={`w-full text-left px-2 py-1 rounded text-xs ${isSel ? "text-white" : "text-white/70 hover:bg-white/10"}`}
                            style={isSel ? { background: ACCENT } : {}}
                          >
                            {new Date(y, m, 1).toLocaleString("en-US", { month: "long" })} ({grouped[y][m].length})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {selected && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-white text-xl font-light">{fmtMonth(selected.y, selected.m)}</h2>
                <Badge className="bg-white/20 text-white border-0">{monthRows.length}</Badge>
              </div>
              <div className="space-y-2">
                {monthRows.map((t) => {
                  const name = t.full_name || `${t.first_name || ""} ${t.last_name || ""}`.trim() || "—";
                  return (
                    <div key={t.id} className="backdrop-blur-md bg-white/40 border border-white/50 rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{name}</span>
                          {(t.province || t.content_style) && <Badge variant="outline" className="bg-white/40 border-white/60 text-xs">{t.province || t.content_style}</Badge>}
                          <Badge variant="outline" className="bg-white/40 border-white/60 text-xs capitalize">{t.status}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 truncate">
                          {t.email} · Closed {t._closedAt.toLocaleDateString("en-US", { timeZone: "America/New_York" })} EST
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => onView(t)} className="px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white text-xs font-medium text-gray-900">View</button>
                        <button onClick={() => onRestore(t.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-medium text-white">Restore</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}