import React from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Archive,
  LayoutGrid,
  CalendarDays,
  Map as MapIcon,
  Table2,
  Inbox as InboxIcon,
  Download,
} from "lucide-react";
import UserMenu from "@/components/dashboard/UserMenu";
import NotificationCenter from "@/components/admin/NotificationCenter";
import BoardTabs from "@/components/board/BoardTabs";

const LOGO_URL =
  "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/c51835c8a_PiPPartner.png";

function ViewIconButton({ active, onClick, icon: Icon, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
        active
          ? "bg-white/90 text-slate-900 shadow-sm"
          : "text-white/75 hover:text-white hover:bg-white/15"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/**
 * Unified header. 3-column grid layout so the source tabs are truly centered
 * regardless of left/right cluster widths.
 *   [Logo] [Source tabs] [View filter + Search + Notif + User]
 */
export default function ApplicationBoardHeader({
  user,
  isAdmin,
  viewMode,
  setViewMode,
  isInfluencerOnly,
  activeTab,
  showArchived,
  setShowArchived,
  showMapView,
  setSearchQuery,
  onMobileSearchOpen,
  unreadMessages,
  totalUnread,
  markAsRead,
  setActiveTab,
  setHiddenColumns,
  setSelectedTicket,
  setHighlightedTicketId,
  setHighlightMessageId,
  onExportCsv,
  canExport,
  boards,
  allowedKeys,
}) {
  const handleNotificationSelect = (ticket, messageId, tabKey) => {
    if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
    setSearchQuery("");
    setHiddenColumns([]);
    setShowArchived(!!ticket?.archived);
    setHighlightedTicketId(ticket?.id || null);
    setTimeout(() => setHighlightedTicketId(null), 3000);
    setHighlightMessageId(messageId);
    setSelectedTicket(ticket);
  };

  const showInbox = !isInfluencerOnly && activeTab !== "influencer";
  const showTable = isInfluencerOnly;

  return (
    <header className="shrink-0 grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-xl shadow-lg">
      {/* Left: Logo */}
      <Link
        to="/Settings"
        onClick={() => {
          setShowArchived(false);
          setSearchQuery("");
        }}
        className="flex items-center shrink-0"
      >
        <img
          src={LOGO_URL}
          alt="Pilates in Pink"
          className="h-9 md:h-10 object-contain drop-shadow-xl hover:scale-105 transition-transform"
        />
      </Link>

      {/* Center: Source tabs */}
      <div className="min-w-0 flex justify-center">
        <BoardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          boards={boards}
          allowedKeys={allowedKeys}
        />
      </div>

      {/* Right: View filter + Search + Notif + User */}
      <div className="flex items-center gap-2 justify-self-end">
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-white/10 border border-white/20">
          {showInbox && (
            <ViewIconButton
              active={!showArchived && viewMode === "inbox"}
              onClick={() => {
                setShowArchived(false);
                setViewMode("inbox");
              }}
              icon={InboxIcon}
              title="Inbox"
            />
          )}
          <ViewIconButton
            active={!showArchived && viewMode === "status"}
            onClick={() => {
              setShowArchived(false);
              setViewMode("status");
            }}
            icon={LayoutGrid}
            title="Board"
          />
          <ViewIconButton
            active={!showArchived && viewMode === "calendar"}
            onClick={() => {
              setShowArchived(false);
              setViewMode("calendar");
            }}
            icon={CalendarDays}
            title="Calendar"
          />
          {showMapView && (
            <ViewIconButton
              active={!showArchived && viewMode === "map"}
              onClick={() => {
                setShowArchived(false);
                setViewMode("map");
              }}
              icon={MapIcon}
              title="Map"
            />
          )}
          {showTable && (
            <ViewIconButton
              active={!showArchived && viewMode === "table"}
              onClick={() => {
                setShowArchived(false);
                setViewMode("table");
              }}
              icon={Table2}
              title="Table"
            />
          )}
          <ViewIconButton
            active={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            icon={Archive}
            title="Archived"
          />
        </div>

        {!showArchived && viewMode === "table" && (
          <button
            onClick={onExportCsv}
            disabled={!canExport}
            title={canExport ? "Export CSV" : "Export CSV — admin access only"}
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              canExport
                ? "bg-white/15 hover:bg-white/25 text-white"
                : "bg-white/5 text-white/40 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onMobileSearchOpen}
          className="h-8 w-8 rounded-full text-white/80 hover:bg-white/15 flex items-center justify-center"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <NotificationCenter
          unreadMessages={unreadMessages}
          totalUnread={totalUnread}
          markAsRead={markAsRead}
          onSelect={handleNotificationSelect}
        />
        <UserMenu />
      </div>
    </header>
  );
}