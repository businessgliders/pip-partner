import React, { useMemo } from "react";
import { Search, Inbox as InboxIcon } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import InboxThreadRow from "./InboxThreadRow";

export default function InboxThreadList({
  title,
  count,
  tickets,
  selectedId,
  onSelect,
  search,
  setSearch,
  sourceKey,
  unreadByTicket = {},
  isLoading,
}) {
  // Franchise: group conversations by submission Month-Year. Other sources
  // render as a flat list.
  const grouped = useMemo(() => {
    if (sourceKey !== "franchise") return null;
    const map = new Map();
    tickets.forEach((t) => {
      const d = new Date(t.created_date || Date.now());
      const key = format(d, "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return Array.from(map.entries());
  }, [tickets, sourceKey]);

  const renderRow = (t) => (
    <InboxThreadRow
      key={t.id}
      ticket={t}
      sourceKey={sourceKey}
      active={selectedId === t.id}
      unread={unreadByTicket[t.id] || 0}
      onClick={() => onSelect(t)}
    />
  );

  return (
    <div className="flex flex-col h-full bg-white/95 rounded-2xl border border-white/40 backdrop-blur overflow-hidden shadow-lg">
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <InboxIcon className="w-4 h-4 text-slate-400" />
            {title}
          </h2>
          {count > 0 && (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-full text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm py-10">
            <InboxIcon className="w-8 h-8 mb-2 opacity-40" />
            No conversations here.
          </div>
        ) : grouped ? (
          grouped.map(([label, rows]) => (
            <div key={label} className="mb-2">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                {label}
              </div>
              <div className="space-y-1 mt-1">{rows.map(renderRow)}</div>
            </div>
          ))
        ) : (
          tickets.map(renderRow)
        )}
      </div>
    </div>
  );
}