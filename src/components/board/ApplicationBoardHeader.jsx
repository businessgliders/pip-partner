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
  Settings as SettingsIcon,
  ArrowLeft,
} from "lucide-react";
import UserMenu from "@/components/dashboard/UserMenu";
import NotificationCenter from "@/components/admin/NotificationCenter";
import BoardTabs from "@/components/board/BoardTabs";
import HeaderSearchBar from "@/components/board/HeaderSearchBar";

export { default as HeaderNotificationBell } from "@/components/admin/NotificationCenter";

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
 *   Desktop (lg+):       [Logo] [Source tabs] [View filter] [Search trigger] [Bell] [Settings] [User]
 *   Tablet/Mobile (<lg): [Logo] [View filter] [Search trigger] [User]
 *                        — Source tabs (Franchise/Instructor/Front desk) move
 *                          into the bottom MobileSourceTabBar (iOS-style).
 *                        — Notification bell moves into the same bottom bar.
 *                        — Settings gear is hidden (admins reach it via UserMenu).
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
  markAllAsRead,
  markAllAsUnread,
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
    // Always open the detail modal on notification click — works across all
    // views (inbox, board, calendar, etc.). The modal applies a brief jiggle
    // animation so the user sees which item the notification opened.
    setSelectedTicket(ticket);
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
      markAllAsRead={markAllAsRead}
      markAllAsUnread={markAllAsUnread}
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
            to="/"
            title="Back to Home"
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <a
            href="/ApplicationBoard?view=inbox"
            title="Reload board — Inbox view"
            className="flex items-center shrink-0"
          >
            <img
              src={LOGO_URL}
              alt="Pilates in Pink"
              className="h-9 md:h-10 object-contain drop-shadow-xl hover:scale-105 transition-transform"
            />
          </a>

          {/* Source tabs — desktop only. On mobile/tablet (< lg) they live in
              the bottom MobileSourceTabBar instead. */}
          <div className="hidden lg:flex flex-1 min-w-0 overflow-x-auto hide-scrollbar -ml-1 justify-start">
            <BoardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              boards={boards}
              allowedKeys={allowedKeys}
            />
          </div>

          {/* Mobile/tablet row-1 cluster — view filter occupies the space where
              source tabs used to be, plus inline search trigger. */}
          <div className="flex lg:hidden flex-1 min-w-0 items-center justify-center gap-2 overflow-x-auto hide-scrollbar">
            {viewFilterCluster}
            {searchTrigger}
          </div>

          {/* Desktop row-1 cluster — view filter + search trigger + bell. */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {viewFilterCluster}
            {searchTrigger}
            {notifBell}
          </div>

          {/* Settings gear — desktop only (mobile/tablet drop it; admins still
              reach Settings via the user menu). */}
          {isAdmin && (
            <Link
              to="/Settings"
              title="Settings"
              className="hidden lg:flex shrink-0 h-8 w-8 rounded-full items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-all"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          )}
          <div className="shrink-0 pl-1 md:pl-2 md:ml-1">
            <UserMenu />
          </div>
        </div>

        {/* Tablet inline search expand — when the search trigger on row 1 is
            tapped, the search bar expands into row 2 here (desktop has its own
            slide-down panel below). */}
        {searchOpen && (
          <div className="lg:hidden mt-2">
            <HeaderSearchBar
              inline
              open
              onClose={() => setSearchOpen(false)}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        )}
      </header>

      {/* Expanded search panel — desktop only. Mobile/tablet renders the
          inline variant inside the header itself (row 2). */}
      <div className="hidden lg:block">
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