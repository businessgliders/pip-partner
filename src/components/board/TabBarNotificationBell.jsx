import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationList from "@/components/admin/NotificationList";

/**
 * Notification bell styled for the mobile/tablet bottom tab bar (white surface).
 * Shares behavior with <NotificationCenter /> via <NotificationList />.
 */
export default function TabBarNotificationBell({
  unreadMessages = [],
  totalUnread = 0,
  markAsRead,
  markAllAsRead,
  markAllAsUnread,
  onSelect,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
            totalUnread > 0 ? "text-slate-900 font-semibold" : "text-slate-500"
          } active:bg-slate-100`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-tight">Alerts</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-sm md:w-96 md:max-w-none p-0 max-h-[60vh] overflow-hidden flex flex-col"
      >
        <NotificationList
          open={open}
          unreadMessages={unreadMessages}
          totalUnread={totalUnread}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          markAllAsUnread={markAllAsUnread}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
          cacheKeyPrefix="notif-tickets-tabbar"
        />
      </PopoverContent>
    </Popover>
  );
}