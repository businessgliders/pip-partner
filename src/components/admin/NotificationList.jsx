import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCheck, Trash2, Mail } from "lucide-react";

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

/**
 * Shared notification list with header actions, used by NotificationCenter
 * (header bell) and TabBarNotificationBell (mobile/tablet bell).
 *
 * Behavior:
 *  - When the popover opens, the parent passes `open=true` which snapshots the
 *    current unread messages into `displayed`. Items remain in the list even
 *    after they are marked as read (faded) so the user can scroll back through
 *    them. The snapshot is rebuilt the next time the popover opens.
 *  - "Clear all" empties the displayed list (without affecting read state).
 *  - "Mark all as read" calls markAllAsRead for everything currently displayed.
 *  - Clicking an item marks it as read (item stays, faded) and triggers
 *    onSelect to navigate.
 */
export default function NotificationList({
  open,
  unreadMessages,
  totalUnread,
  markAsRead,
  markAllAsRead,
  markAllAsUnread,
  onSelect,
  onClose,
  cacheKeyPrefix = "notif-tickets",
}) {
  // Snapshot of message IDs to show. Rebuilt on every popover open so newly
  // arrived notifications are pulled in, but stable while the popover is open.
  const [displayedIds, setDisplayedIds] = useState([]);
  // Ids the user "cleared" in this open session (hidden from the list).
  const [clearedIds, setClearedIds] = useState(new Set());
  // Ids the user marked-as-read in this session (kept visible but faded).
  const [sessionReadIds, setSessionReadIds] = useState(new Set());

  useEffect(() => {
    if (open) {
      setDisplayedIds(unreadMessages.map((m) => m.id));
      setClearedIds(new Set());
      setSessionReadIds(new Set());
    }
    // We deliberately do not depend on `unreadMessages` — we want the snapshot
    // taken on open, not on every poll while the popover is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Build a lookup so we can render items even after they've been removed from
  // `unreadMessages` (they get marked read while the popover is open).
  const messageById = useMemo(() => {
    const map = new Map();
    for (const m of unreadMessages) map.set(m.id, m);
    return map;
  }, [unreadMessages]);

  // Messages we still need to display (from the snapshot, minus cleared).
  const visibleMessages = useMemo(() => {
    return displayedIds
      .filter((id) => !clearedIds.has(id))
      .map((id) => messageById.get(id))
      .filter(Boolean);
  }, [displayedIds, clearedIds, messageById]);

  const ticketRefs = useMemo(() => {
    const seen = new Map();
    for (const m of visibleMessages) {
      if (!m.ticket_id || !m.ticket_type) continue;
      const key = `${m.ticket_type}::${m.ticket_id}`;
      if (!seen.has(key)) seen.set(key, { id: m.ticket_id, type: m.ticket_type });
    }
    return Array.from(seen.values());
  }, [visibleMessages]);

  const { data: ticketMap = {} } = useQuery({
    queryKey: [cacheKeyPrefix, ticketRefs.map((t) => `${t.type}:${t.id}`).join("|")],
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
    return [...visibleMessages]
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
  }, [visibleMessages, ticketMap]);

  const handleClick = async (item) => {
    onClose?.();
    if (item.ticket && onSelect) {
      const tabKey = ENTITY_TO_TAB_KEY[item.m.ticket_type];
      onSelect(item.ticket, item.m.id, tabKey);
    }
    setSessionReadIds((prev) => {
      const next = new Set(prev);
      next.add(item.m.id);
      return next;
    });
    try {
      await markAsRead(item.m.id);
    } catch {
      // swallow
    }
  };

  const handleMarkAllRead = async () => {
    const ids = items.map((i) => i.m.id);
    if (ids.length === 0) return;
    setSessionReadIds(new Set(ids));
    try {
      await markAllAsRead?.(ids);
    } catch {
      // swallow
    }
  };

  const handleMarkAllUnread = async () => {
    const ids = items.map((i) => i.m.id);
    if (ids.length === 0) return;
    setSessionReadIds(new Set());
    try {
      await markAllAsUnread?.(ids);
    } catch {
      // swallow
    }
  };

  const handleClearAll = () => {
    setClearedIds(new Set(displayedIds));
  };

  // Are all currently displayed items already read? If so, the "Mark all read"
  // button flips into "Mark all unread" so the toggle is reversible.
  const allDisplayedAreRead =
    items.length > 0 &&
    items.every((i) => {
      if (sessionReadIds.has(i.m.id)) return true;
      const readBy = Array.isArray(i.m.read_by) ? i.m.read_by : [];
      return readBy.length > 0;
    });

  return (
    <>
      <div className="px-4 py-3 border-b bg-gradient-to-r from-pink-50 to-amber-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-semibold text-gray-800">Notifications</div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {totalUnread} unread
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {allDisplayedAreRead ? (
              <button
                type="button"
                onClick={handleMarkAllUnread}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white/60"
                title="Mark all as unread"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all unread</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white/60"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white/60"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          </div>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {items.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10 px-4">
            You're all caught up 🎉
          </div>
        ) : (
          items.map((item) => {
            const isRead = sessionReadIds.has(item.m.id);
            return (
              <button
                key={item.m.id}
                onClick={() => handleClick(item)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-pink-50/60 transition-colors flex flex-col gap-0.5 ${
                  isRead ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                    )}
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {item.ticketName}
                    </div>
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
            );
          })
        )}
      </div>
    </>
  );
}