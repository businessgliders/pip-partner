import React, { useState } from "react";
import { format } from "date-fns";
import { Bell, CheckCheck, Reply } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useReplyNotifications from "@/hooks/useReplyNotifications";
import { displayName } from "@/components/board/boardConfig";
import CrmEmailDrawer from "./CrmEmailDrawer";
import { CRM } from "./crmTheme";

const SOURCE_LABELS = { franchise: "Franchising", instructor: "Instructor", frontadmin: "Front Desk", influencer: "Influencer" };

// Header bell + expanded 2-column notification centre for inbound replies.
export default function CrmNotificationBell({ currentUser }) {
  const { notifications, unreadTotal, markRead, markAllRead } = useReplyNotifications();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(null); // { ticket, entity, messageId }

  const items = notifications.slice(0, 30);

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
        <PopoverContent align="end" className="crm-root w-[min(92vw,560px)] p-0 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ background: CRM.blush }}>
            <div className="text-sm font-semibold" style={{ color: CRM.ink }}>
              Notifications
              {unreadTotal > 0 && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#f1889b" }}>
                  {unreadTotal} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadTotal === 0}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold bg-white/80 hover:bg-white disabled:opacity-50"
              style={{ color: CRM.ink }}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-[13px]" style={{ color: CRM.sub }}>
              No replies yet. New replies from leads will show up here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 max-h-[420px] overflow-y-auto">
              {items.map((n) => (
                <button
                  key={n.message.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className="relative text-left rounded-xl p-3 transition-colors hover:bg-[#fdf8f4]"
                  style={{
                    border: n.unread ? "1px solid rgba(241,136,155,0.5)" : "1px solid rgba(182,118,81,0.12)",
                    background: n.unread ? "#fef5f6" : "#ffffff",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1 pr-6">
                    <Reply className="w-3.5 h-3.5 shrink-0" style={{ color: n.unread ? "#f1889b" : CRM.sub }} />
                    <span className="text-[12px] font-semibold truncate" style={{ color: CRM.ink }}>
                      {displayName(n.ticket)}
                    </span>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(182,118,81,0.08)", color: CRM.sub }}
                    >
                      {SOURCE_LABELS[n.boardKey] || n.boardKey}
                    </span>
                  </div>
                  <div className="text-[11px] leading-snug line-clamp-2 mb-1" style={{ color: "#5c4a3f" }}>
                    {n.message.snippet || n.message.subject || "New reply"}
                  </div>
                  <div className="text-[10px]" style={{ color: CRM.sub }}>
                    {n.ts ? format(new Date(n.ts), "MMM d, h:mm a") : ""}
                  </div>
                  {n.unread && (
                    <span
                      role="button"
                      tabIndex={0}
                      title="Mark as read"
                      onClick={(e) => { e.stopPropagation(); markRead.mutate(n.message); }}
                      className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white"
                    >
                      <CheckCheck className="w-3.5 h-3.5" style={{ color: "#f1889b" }} />
                    </span>
                  )}
                </button>
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