import React, { useMemo, useState } from "react";
import { Search, Inbox as InboxIcon, Reply, Check } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InboxThreadRow from "./InboxThreadRow";
import InboxSortMenu from "./InboxSortMenu";
import { getDefaultSort, sortTickets } from "./inboxSort";

const REPLY_FILTERS = [
  { key: "all", label: "All conversations" },
  { key: "replied", label: "Replied" },
  { key: "not_replied", label: "Not replied" },
];

export default function InboxThreadList({
  title,
  count,
  tickets,
  selectedId,
  onSelect,
  search,
  setSearch,
  sourceKey,
  statusKey,
  unreadByTicket = {},
  isLoading,
}) {
  // Sort mode is per-list (resets when the source/status changes via parent unmount).
  // Franchise gets both options; other sources only get submission date.
  // Default: franchise "new" status = submission; all other franchise statuses
  // = appointment (soonest upcoming first).
  const showAppointment = sourceKey === "franchise";
  const [sortMode, setSortMode] = useState(getDefaultSort(sourceKey, statusKey));
  const effectiveSort = showAppointment ? sortMode : "submission";

  // Reply filter — independent of sort/source. Resets via parent unmount when
  // the source / status changes (same pattern as sort).
  const [replyFilter, setReplyFilter] = useState("all");

  const filteredTickets = useMemo(() => {
    if (replyFilter === "all") return tickets;
    if (replyFilter === "replied") return tickets.filter((t) => t._has_reply);
    return tickets.filter((t) => !t._has_reply);
  }, [tickets, replyFilter]);

  const sortedTickets = useMemo(
    () => sortTickets(filteredTickets, effectiveSort),
    [filteredTickets, effectiveSort]
  );

  // Franchise + submission sort: group conversations by submission Month-Year.
  // All other combinations render as a flat list.
  const grouped = useMemo(() => {
    if (sourceKey !== "franchise" || effectiveSort !== "submission") return null;
    const map = new Map();
    sortedTickets.forEach((t) => {
      const d = new Date(t.created_date || Date.now());
      const key = format(d, "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return Array.from(map.entries());
  }, [sortedTickets, sourceKey, effectiveSort]);

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
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 min-w-0">
            <InboxIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{title}</span>
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {count > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Filter by reply status"
                  className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                    replyFilter === "all"
                      ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Reply status
                </div>
                {REPLY_FILTERS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => setReplyFilter(opt.key)}
                    className="cursor-pointer text-xs flex items-center gap-2"
                  >
                    <span className="flex-1">{opt.label}</span>
                    {replyFilter === opt.key && (
                      <Check className="w-3.5 h-3.5 text-slate-700" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <InboxSortMenu
              value={effectiveSort}
              onChange={setSortMode}
              showAppointment={showAppointment}
            />
          </div>
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
        ) : sortedTickets.length === 0 ? (
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
          sortedTickets.map(renderRow)
        )}
      </div>
    </div>
  );
}