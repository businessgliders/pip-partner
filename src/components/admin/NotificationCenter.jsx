import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ENTITY_TO_TAB_KEY = {
  FranchiseInquiry: "franchise",
  InfluencerApplication: "influencer",
  InstructorApplication: "instructor",
  FrontAdminApplication: "frontadmin",
};

function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function relativeTime(iso) {
  if (!iso) return "";
  let s = iso;
  if (typeof s === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s = `${s}Z`;
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

/**
 * Resolves a ticket entity by id, trying the relevant entity based on ticket_type.
 */
async function fetchTicket(ticketType, ticketId) {
  const Entity = base44.entities[ticketType];
  if (!Entity) return null;
  try {
    const rows = await Entity.filter({ id: ticketId }, "-created_date", 1);
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

export default function NotificationCenter({ unreadMessages, totalUnread, markAsRead, onSelect }) {
  const [open, setOpen] = useState(false);

  // Build a list of unique ticket_ids we need names for
  const ticketRefs = useMemo(() => {
    const seen = new Map();
    for (const m of unreadMessages) {
      if (!m.ticket_id || !m.ticket_type) continue;
      const key = `${m.ticket_type}::${m.ticket_id}`;
      if (!seen.has(key)) seen.set(key, { id: m.ticket_id, type: m.ticket_type });
    }
    return Array.from(seen.values());
  }, [unreadMessages]);

  const { data: ticketMap = {} } = useQuery({
    queryKey: ["notif-tickets", ticketRefs.map((t) => `${t.type}:${t.id}`).join("|")],
    queryFn: async () => {
      const results = await Promise.all(
        ticketRefs.map((t) => fetchTicket(t.type, t.id).then((row) => [t.id, row]))
      );
      return Object.fromEntries(results);
    },
    enabled: ticketRefs.length > 0,
    staleTime: 30000,
  });

  const items = useMemo(() => {
    return [...unreadMessages]
      .sort(
        (a, b) =>
          new Date(b.sent_at || b.created_date || 0).getTime() -
          new Date(a.sent_at || a.created_date || 0).getTime()
      )
      .map((m) => {
        const ticket = ticketMap[m.ticket_id] || null;
        const ticketName =
          ticket?.full_name ||
          [ticket?.first_name, ticket?.last_name].filter(Boolean).join(" ") ||
          m.from_name ||
          m.from_email ||
          "Unknown";
        const preview = stripHtml(m.body_html || m.snippet || m.body_text || "").slice(0, 80);
        return { m, ticket, ticketName, preview };
      });
  }, [unreadMessages, ticketMap]);

  const handleClick = async (item) => {
    setOpen(false);
    if (item.ticket && onSelect) {
      const tabKey = ENTITY_TO_TAB_KEY[item.m.ticket_type];
      onSelect(item.ticket, item.m.id, tabKey);
    }
    try {
      await markAsRead(item.m.id);
    } catch (e) {
      // swallow
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-11 w-11 rounded-xl backdrop-blur-md bg-white/70 border border-white/80 text-gray-900 hover:bg-white/80 shadow-lg flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b bg-gradient-to-r from-pink-50 to-amber-50 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">Notifications</div>
          <div className="text-xs text-gray-500">
            {totalUnread} unread
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-10 px-4">
              You're all caught up 🎉
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.m.id}
                onClick={() => handleClick(item)}
                className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-pink-50/60 transition-colors flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {item.ticketName}
                  </div>
                  <div className="text-[10px] text-gray-500 whitespace-nowrap">
                    {relativeTime(item.m.sent_at || item.m.created_date)}
                  </div>
                </div>
                <div className="text-xs text-gray-700 truncate">
                  {item.m.subject || "(no subject)"}
                </div>
                {item.preview && (
                  <div className="text-[11px] text-gray-500 line-clamp-1">{item.preview}</div>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}