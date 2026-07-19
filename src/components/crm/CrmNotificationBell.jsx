import React, { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useReplyNotifications from "@/hooks/useReplyNotifications";
import { displayName } from "@/components/board/boardConfig";
import CrmEmailDrawer from "./CrmEmailDrawer";
import { CRM } from "./crmTheme";

const COLUMNS = [
  { key: "franchise", label: "Franchising" },
  { key: "instructor", label: "Instructor" },
  { key: "frontadmin", label: "Front Desk" },
  { key: "influencer", label: "Influencer" },
];

function timeAgo(ts) {
  const h = Math.floor((Date.now() - ts) / 3600000);
  if (h < 1) return "now";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Header bell + multi-column notification centre (one column per lead source).
export default function CrmNotificationBell({ currentUser }) {
  const { notifications, unreadTotal, markRead, markAllRead } = useReplyNotifications();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(null); // { ticket, entity, messageId }

  const cols = COLUMNS.map((c) => ({
    ...c,
    items: notifications.filter((n) => n.boardKey === c.key).slice(0, 15),
    unread: notifications.filter((n) => n.boardKey === c.key && n.unread).length,
  })).filter((c) => c.items.length > 0);

  const openNotification = (n) => {
    if (n.unread) markRead.mutate(n.message);
    setOpen(false);
    setDrawer({ ticket: n.ticket, entity: n.entity, messageId: n.message.id });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/70 transition-colors"
            title="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" style={{ color: CRM.ink }} />
            {unreadTotal > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: "#f1889b" }}
              >
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="crm-root w-[min(94vw,720px)] p-0 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(182,118,81,0.12)" }}>
            <span className="text-[15px] font-semibold" style={{ color: CRM.ink }}>Notifications</span>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadTotal === 0}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold disabled:opacity-40"
              style={{ background: CRM.blush, color: "#a34a5c" }}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>

          {cols.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: CRM.sub }}>
              No replies yet. New replies from leads will show up here.
            </div>
          ) : (
            <div
              className="grid divide-x max-h-[440px] overflow-y-auto"
              style={{
                gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
                borderColor: "rgba(182,118,81,0.12)",
              }}
            >
              {cols.map((c) => (
                <div key={c.key} className="min-w-0">
                  <div
                    className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-white border-b"
                    style={{ borderColor: "rgba(182,118,81,0.12)" }}
                  >
                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: CRM.sub }}>
                      <Bell className="w-3 h-3" /> {c.label}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: c.unread ? "#f1889b" : CRM.sub }}>
                      {c.unread}
                    </span>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {c.items.map((n) => {
                      const num = n.ticket.display_ticket_number || n.ticket.app_number;
                      return (
                        <button
                          key={n.message.id}
                          type="button"
                          onClick={() => openNotification(n)}
                          className="w-full text-left rounded-lg px-2.5 py-2 transition-colors hover:bg-[#fdf8f4]"
                          style={{ background: n.unread ? "#fef0f3" : "transparent" }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="flex-1 text-[11px] font-semibold truncate" style={{ color: CRM.ink }}>
                              New reply from {displayName(n.ticket)}
                            </span>
                            {n.unread && (
                              <span
                                role="button"
                                tabIndex={0}
                                title="Mark as read"
                                onClick={(e) => { e.stopPropagation(); markRead.mutate(n.message); }}
                                className="w-4 h-4 shrink-0 flex items-center justify-center"
                              >
                                <span className="w-2 h-2 rounded-full" style={{ background: "#f1889b" }} />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] truncate mt-0.5" style={{ color: CRM.sub }}>
                            {num ? `#${num} ` : ""}{n.message.snippet || n.message.subject || ""} · {timeAgo(n.ts)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {drawer && (
        <CrmEmailDrawer
          ticket={drawer.ticket}
          ticketType={drawer.entity}
          currentUser={currentUser}
          highlightMessageId={drawer.messageId}
          onClose={() => setDrawer(null)}
        />
      )}
    </>
  );
}