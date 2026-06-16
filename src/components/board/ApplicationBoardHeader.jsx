import React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
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

const LOGO_URL =
  "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/c51835c8a_PiPPartner.png";

function ViewButton({ active, onClick, icon: Icon, label, title }) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      className={`relative flex items-center justify-center gap-1.5 px-2 md:px-3 h-9 rounded-full text-xs md:text-sm font-medium transition-all ${
        active
          ? "bg-white/90 text-slate-900 shadow-sm"
          : "text-white/75 hover:text-white hover:bg-white/15"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

/**
 * Single unified header for the ApplicationBoard. Style mirrors pip-hub's
 * InboxTopBar: glass strip with logo on the left, view buttons + utility
 * icons on the right.
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
  searchQuery,
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
    <header
      className="shrink-0 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-xl shadow-lg"
    >
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
          className="h-10 md:h-12 object-contain drop-shadow-xl hover:scale-105 transition-transform"
        />
      </Link>

      {/* Search — inline on desktop, icon button on mobile */}
      <div className="hidden md:block ml-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-44 lg:w-56 bg-white/10 border-white/25 text-white placeholder:text-white/50 rounded-full"
          />
        </div>
      </div>
      <button
        onClick={onMobileSearchOpen}
        className="md:hidden h-9 w-9 rounded-full text-white/80 hover:bg-white/15 flex items-center justify-center"
        title="Search"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Spacer pushes everything else right */}
      <div className="flex-1" />

      {/* View filter pill group */}
      {!showArchived && (
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-white/10 border border-white/20">
          {showInbox && (
            <ViewButton
              active={viewMode === "inbox"}
              onClick={() => setViewMode("inbox")}
              icon={InboxIcon}
              label="Inbox"
            />
          )}
          <ViewButton
            active={viewMode === "status"}
            onClick={() => setViewMode("status")}
            icon={LayoutGrid}
            label="Board"
          />
          <ViewButton
            active={viewMode === "calendar"}
            onClick={() => setViewMode("calendar")}
            icon={CalendarDays}
            label="Calendar"
          />
          {showMapView && (
            <ViewButton
              active={viewMode === "map"}
              onClick={() => setViewMode("map")}
              icon={MapIcon}
              label="Map"
            />
          )}
          {showTable && (
            <ViewButton
              active={viewMode === "table"}
              onClick={() => setViewMode("table")}
              icon={Table2}
              label="Table"
            />
          )}
          <ViewButton
            active={false}
            onClick={() => setShowArchived(true)}
            icon={Archive}
            label="Archive"
            title="Archived"
          />
        </div>
      )}

      {/* Archive return button */}
      {showArchived && (
        <button
          onClick={() => setShowArchived(false)}
          title="Back to board"
          className="h-9 px-3 rounded-full bg-purple-500/80 border border-purple-400/80 text-white shadow-md flex items-center gap-1.5 text-xs md:text-sm font-medium"
        >
          <Archive className="w-4 h-4" />
          <span>Archived</span>
        </button>
      )}

      {/* Export — only meaningful in table view */}
      {!showArchived && viewMode === "table" && (
        <button
          onClick={onExportCsv}
          disabled={!canExport}
          title={canExport ? "Export CSV" : "Export CSV — admin access only"}
          className={`h-9 px-3 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 ${
            canExport
              ? "bg-white/15 hover:bg-white/25 text-white"
              : "bg-white/5 text-white/40 cursor-not-allowed"
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Export</span>
        </button>
      )}

      {/* Utility icons */}
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