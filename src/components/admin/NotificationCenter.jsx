import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationList from "./NotificationList";

export default function NotificationCenter({
  unreadMessages,
  totalUnread,
  markAsRead,
  markAllAsRead,
  onSelect,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 rounded-full text-white/80 hover:bg-white/15 flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] max-w-sm md:w-96 md:max-w-none p-0 max-h-[70vh] overflow-hidden flex flex-col mx-auto"
      >
        <NotificationList
          open={open}
          unreadMessages={unreadMessages}
          totalUnread={totalUnread}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
          cacheKeyPrefix="notif-tickets"
        />
      </PopoverContent>
    </Popover>
  );
}