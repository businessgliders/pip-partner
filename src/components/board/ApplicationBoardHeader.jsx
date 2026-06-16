import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
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
import HeaderSearchBar from "@/components/board/HeaderSearchBar";

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
 * Unified header.
 *
 * Layout breakdown:
 *   Desktop (lg+):    [Logo] [Source tabs] [View filter] [Search trigger] [Bell] [User]
 *   Tablet (md..lg):  Row 1 = [Logo] [Source tabs] [View filter] [User]
 *                     Row 2 = [Glass search expand] [Bell] (when search is closed,
 *                             the trigger sits next to the bell on row 2)
 *   Mobile (< md):    Row 1 = [Logo] [Source tabs (compact icon-only via BoardTabs)] [User]
 *                     Row 2 = [View filter] [Search trigger] [Bell]
 *
 * The expanded search bar always slides in BELOW the header rows as a separate
 * glass panel (HeaderSearchBar).
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
  currentViewMode,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNotificationSelect = (ticket, messageId, tabKey) => {
    if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
    setSearchQuery("");
    setHiddenColumns([]);
    setShowArchived(!!ticket?.archived);
    setHighlightedTicketId(ticket?.id || null);
    setTimeout(() => setHighlightedTicketId(null), 3000);
    setHighlightMessageId(messageId);
    if (currentViewMode !== "inbox") {
      setSelectedTicket(ticket);
    }
  };

  const showInbox = !isInfluencerOnly && activeTab !== "influencer";
  const showTable = isInfluencerOnly;

  const viewFilterCluster = (
    <>
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
        {/* Board view is hidden for franchise — Inbox is the primary view there.
            The mode itself isn't removed (just the toggle) so any deep links
            with ?view=status still work. */}
        {activeTab !== "franchise" && (
          <ViewIconButton
            active={!showArchived && viewMode === "status"}
            onClick={() => {
              setShowArchived(false);
              setViewMode("status");
            }}
            icon={LayoutGrid}
            title="Board"
          />
        )}
        {activeTab !== "instructor" && activeTab !== "frontadmin" && (
          <ViewIconButton
            active={!showArchived && viewMode === "calendar"}
            onClick={() => {
              setShowArchived(false);
              setViewMode("calendar");
            }}
            icon={CalendarDays}
            title="Calendar"
          />
        )}
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
    </>
  );

  // Search trigger button (glass pill). Used inline on row 2 of tablet/mobile.
  const searchTrigger = (
    <button
      onClick={() => setSearchOpen((v) => !v)}
      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
        searchOpen
          ? "bg-white/90 text-slate-900 shadow-sm"
          : "text-white/80 hover:bg-white/15"
      }`}
      title="Search"
    >
      <Search className="w-4 h-4" />
    </button>
  );

  const notifBell = (
    <NotificationCenter
      unreadMessages={unreadMessages}
      totalUnread={totalUnread}
      markAsRead={markAsRead}
      onSelect={handleNotificationSelect}
    />
  );

  return (
    <>
      <header className="shrink-0 rounded-2xl border border-white/40 bg-white/15 backdrop-blur-xl shadow-lg px-3 md:px-4 py-2">
        {/* ─── ROW 1 ────────────────────────────────────────────────
            Mobile: Logo + Source tabs centred + User (far right)
            Tablet: Logo + Source tabs + View filter + User
            Desktop: Logo + Source tabs + View filter + Search trigger + Bell + User
        */}
        <div className="flex items-center gap-2 md:gap-3 flex-nowrap">
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

          {/* Source tabs — centred on mobile, left-aligned (after logo) on md+. */}
          <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar -ml-1 flex justify-center md:justify-start">
            <BoardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              boards={boards}
              allowedKeys={allowedKeys}
            />
          </div>

          {/* Tablet row-1 cluster — view filter only (search + bell move to row 2). */}
          <div className="hidden md:flex lg:hidden items-center gap-2 shrink-0">
            {viewFilterCluster}
          </div>

          {/* Desktop row-1 cluster — view filter + search trigger + bell. */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {viewFilterCluster}
            {searchTrigger}
            {notifBell}
          </div>

          {/* User menu — always row 1, far right */}
          <div className="shrink-0 pl-1 md:pl-2 md:ml-1">
            <UserMenu />
          </div>
        </div>

        {/* ─── ROW 2 (mobile) ──────────────────────────────────────
            View filter centred, with search + bell on the right.
        */}
        <div className="md:hidden mt-2 relative flex items-center min-h-[36px]">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {viewFilterCluster}
          </div>
          <div className="ml-auto flex items-center gap-1 shrink-0 relative z-10">
            {searchTrigger}
            {notifBell}
          </div>
        </div>

        {/* ─── ROW 2 (tablet only) ─────────────────────────────────
            Search (expands inline) + bell, right-aligned.
        */}
        <div className="hidden md:flex lg:hidden mt-2 items-center justify-end gap-2">
          {searchOpen ? (
            <HeaderSearchBar
              inline
              open
              onClose={() => setSearchOpen(false)}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          ) : (
            searchTrigger
          )}
          {notifBell}
        </div>
      </header>

      {/* Expanded search panel — sits below the header on mobile + desktop.
          Tablet (md..lg) uses the inline variant in row 2 instead. */}
      <div className="md:hidden lg:block">
        <HeaderSearchBar
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
    </>
  );
}