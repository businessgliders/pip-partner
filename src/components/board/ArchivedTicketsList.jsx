import React, { useMemo, useState } from "react";
import { Archive, ChevronDown, ChevronRight } from "lucide-react";

function closedTimestamp(t) {
  const hist = Array.isArray(t.status_history) ? t.status_history : [];
  const closedEntry = [...hist].reverse().find((e) => String(e?.status || "").toLowerCase() === "closed");
  return closedEntry?.timestamp || hist[hist.length - 1]?.timestamp || t.created_date;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ArchivedTicketsList({ tickets, onRestore, onView, accentColor = "#b67651" }) {
  const grouped = useMemo(() => {
    const tree = {};
    (tickets || []).forEach((t) => {
      const ts = closedTimestamp(t);
      if (!ts) return;
      const d = new Date(ts);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = d.getMonth();
      if (!tree[year]) tree[year] = {};
      if (!tree[year][month]) tree[year][month] = [];
      tree[year][month].push(t);
    });
    return tree;
  }, [tickets]);

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);
  const initialYear = years[0];
  const initialMonth = initialYear != null ? Object.keys(grouped[initialYear]).map(Number).sort((a, b) => b - a)[0] : null;

  const [openYears, setOpenYears] = useState(() => (initialYear != null ? { [initialYear]: true } : {}));
  const [selected, setSelected] = useState(() =>
    initialYear != null && initialMonth != null ? { year: initialYear, month: initialMonth } : null
  );

  if (!tickets || tickets.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl flex-1 flex flex-col items-center justify-center text-white/70">
        <Archive className="w-10 h-10 mb-2 opacity-70" />
        <div>No archived applications</div>
      </div>
    );
  }

  const monthTickets = selected ? (grouped[selected.year]?.[selected.month] || []) : [];

  return (
    <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 md:p-6 shadow-xl flex-1 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        <div className="md:w-60 overflow-y-auto custom-scrollbar">
          <h3 className="text-white font-semibold mb-3">Archive</h3>
          {years.map((year) => {
            const months = Object.keys(grouped[year]).map(Number).sort((a, b) => b - a);
            const total = months.reduce((s, m) => s + grouped[year][m].length, 0);
            const isOpen = !!openYears[year];
            return (
              <div key={year} className="mb-2">
                <button
                  onClick={() => setOpenYears((s) => ({ ...s, [year]: !s[year] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-white hover:bg-white/20 text-sm"
                >
                  <span className="flex items-center gap-1">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {year}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 border border-white/30">{total}</span>
                </button>
                {isOpen && (
                  <div className="ml-5 mt-1 space-y-0.5">
                    {months.map((m) => {
                      const isSel = selected?.year === year && selected?.month === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setSelected({ year, month: m })}
                          className={`w-full text-left px-2 py-1 rounded-md text-xs ${
                            isSel ? "text-white" : "text-white/80 hover:bg-white/20"
                          }`}
                          style={isSel ? { background: accentColor } : undefined}
                        >
                          {MONTHS[m]} <span className="opacity-70">({grouped[year][m].length})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selected && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-white text-lg font-semibold">{MONTHS[selected.month]} {selected.year}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 border border-white/40 text-white">
                  {monthTickets.length}
                </span>
              </div>
              <div className="space-y-2">
                {monthTickets.map((t) => {
                  const ts = closedTimestamp(t);
                  const closedDate = ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : "";
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/30 border border-white/40 backdrop-blur-md">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{t._display_name || "Unknown"}</div>
                        <div className="text-[11px] text-white/80 truncate">
                          {t._category || ""} · {t.status} · {t.email || ""}
                        </div>
                        <div className="text-[11px] text-white/70">Closed {closedDate} EST</div>
                      </div>
                      <button
                        onClick={() => onView?.(t)}
                        className="px-2 py-1 text-[11px] rounded-md bg-white/40 border border-white/50 text-white hover:bg-white/60"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onRestore?.(t)}
                        className="px-2 py-1 text-[11px] rounded-md bg-emerald-500/80 border border-emerald-400 text-white hover:bg-emerald-500"
                      >
                        Restore
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
      `}</style>
    </div>
  );
}