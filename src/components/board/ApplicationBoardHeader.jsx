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
import ChangelogPopup from "@/components/admin/ChangelogPopup";
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
 * Single unified header for ApplicationBoard. Layout:
 *   [Logo] [Search icon] [Source tabs (center)] [View icons] [Changelog] [Notif] [User]
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
    <header className="shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-xl shadow-lg">
      {/* Logo */}
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

      {/* Search (icon-only) */}
      <button
        onClick={onMobileSearchOpen}
        className="h-8 w-8 rounded-full text-white/80 hover:bg-white/15 flex items-center justify-center shrink-0"
        title="Search"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Source tabs — centered */}
      <div className="flex-1 min-w-0 flex justify-center">
        <BoardTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          boards={boards}
          allowedKeys={allowedKeys}
        />
      </div>

      {/* View filter pill (icon-only) */}
      {!showArchived && (
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-white/10 border border-white/20 shrink-0">
          {showInbox && (
            <ViewIconButton
              active={viewMode === "inbox"}
              onClick={() => setViewMode("inbox")}
              icon={InboxIcon}
              title="Inbox"
            />
          )}
          <ViewIconButton
            active={viewMode === "status"}
            onClick={() => setViewMode("status")}
            icon={LayoutGrid}
            title="Board"
          />
          <ViewIconButton
            active={viewMode === "calendar"}
            onClick={() => setViewMode("calendar")}
            icon={CalendarDays}
            title="Calendar"
          />
          {showMapView && (
            <ViewIconButton
              active={viewMode === "map"}
              onClick={() => setViewMode("map")}
              icon={MapIcon}
              title="Map"
            />
          )}
          {showTable && (
            <ViewIconButton
              active={viewMode === "table"}
              onClick={() => setViewMode("table")}
              icon={Table2}
              title="Table"
            />
          )}
          <ViewIconButton
            active={false}
            onClick={() => setShowArchived(true)}
            icon={Archive}
            title="Archived"
          />
        </div>
      )}

      {showArchived && (
        <button
          onClick={() => setShowArchived(false)}
          title="Back to board"
          className="h-9 px-3 rounded-full bg-purple-500/80 border border-purple-400/80 text-white shadow-md flex items-center gap-1.5 text-xs md:text-sm font-medium shrink-0"
        >
          <Archive className="w-4 h-4" />
          <span>Archived</span>
        </button>
      )}

      {!showArchived && viewMode === "table" && (
        <button
          onClick={onExportCsv}
          disabled={!canExport}
          title={canExport ? "Export CSV" : "Export CSV — admin access only"}
          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
            canExport
              ? "bg-white/15 hover:bg-white/25 text-white"
              : "bg-white/5 text-white/40 cursor-not-allowed"
          }`}
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      <ChangelogPopup user={user} />
      <NotificationCenter
        unreadMessages={unreadMessages}
        totalUnread={totalUnread}
        markAsRead={markAsRead}
        onSelect={handleNotificationSelect}
      />
      <UserMenu />
    </header>
  );
}